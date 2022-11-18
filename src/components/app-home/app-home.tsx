import {Component, Element, Event, EventEmitter, forceUpdate, h} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {TempReaderService} from '../../global/tempReaderService';
import {filter, takeUntil} from 'rxjs/operators';

import {Log} from '../console-component/model';
import {NotificationService} from '../../global/notificationService';
import {Subject} from 'rxjs';
import {TempKeeper} from '../../global/tempKeeper';
import {IPowerChangeResponse} from './model';
import {Settings} from '../my-app/settings';
import {BackgroundService} from '../../global/backgroundService';
import {Capacitor, Plugins} from '@capacitor/core';
import {AppThemeSetting} from '../app-settings/model';
import {ISettings} from '../../global/settings';
import {alertController} from '@ionic/core';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss'
})
export class AppHome {

  @Element() el: HTMLStencilElement;

  @Event({
    bubbles: true,
    composed: true
  }) domReady: EventEmitter;

  sensorTempElement: HTMLSensorTempElement;
  consoleElement: HTMLConsoleComponentElement;
  tempReaderService: TempReaderService = new TempReaderService();
  notificationService: NotificationService = new NotificationService();
  currentTemp: number;
  sensorOnline: boolean = true;
  tempInRange: boolean = true;
  killReading$: Subject<boolean> = new Subject<boolean>();
  keeper: TempKeeper = new TempKeeper();
  devicePower: IPowerChangeResponse;
  backgroundService: BackgroundService;

  private tempChart: HTMLTemperatureChartElement | undefined;

  constructor() {

  }

  componentWillLoad(): void {
    this.backgroundService = new BackgroundService();
    //TODO:
    // check how to handle background stuff, does it make sense in this scenario
    this.backgroundService.init();

    const appSplashScreen = (document.querySelector('#appSplashScreen') as HTMLElement);
    if (appSplashScreen) {
      appSplashScreen.className += ' splashHide';
    }

    this.manageDevice();
    this.startReadingTemp();
    this.keeper.msgFeed.subscribe(async (msg: string) => {
      await this.logInfoMsg(msg);
    });
  }

  async componentDidLoad(): Promise<void> {
    await this.el.querySelector<HTMLIonTabsElement>('ion-tabs').select('abc');

    await this.logInfoMsg('App started successfully. Waiting for sensor to get first data..');
    await this.notificationService.askForPermissions();

    this.backgroundService.consoleFeed$.subscribe(async (log: Log) => {
      await this.consoleElement.update(log);
    });

    this.tempReaderService.startReadingTemp();

    await this.updateGauge();

    if (!Settings.dontShowViewModeChooser) {
      await this.askForReadOnlyMode();
    }

    this.checkIfToggleDarkTheme();

    Settings.changed$.subscribe((newSettings: ISettings) => {
      if (newSettings.appTheme === 'Dark') {
        this.toggleDarkTheme(true);
      }
      if (newSettings.appTheme === 'Light') {
        this.toggleDarkTheme(false);
      }
    });

    this.domReady.emit();

    await this.registerPhoneAppOnlyPlugins();
  }

  render(): any[] {
    return [
      <ion-content>
        <ion-tabs onIonTabsDidChange={(ev: CustomEvent<{ tab: string }>) => this.tabChanged(ev)}>
          <ion-tab tab="abc">
            <sensor-temp
              class={!this.sensorOnline ? 'inactive' : ''}
              ref={(ref: any) => this.sensorTempElement = ref as any}
              val={this.currentTemp}
              min={Settings.settingsFromServer?.minTemp} max={Settings?.maxTemp}/>
            <div class={{
              'dot': true,
              'dotWithText': !!this.currentTemp,
              'alertDot': !this.sensorOnline || !this.tempInRange
            }}>
              {this.currentTemp}
            </div>
            <div
              hidden={this.devicePower?.POWER === 'OFF'}
              class={{
                'freezingIcon': true
              }}>
              <ion-icon name="snow-outline"/>
            </div>
          </ion-tab>

          <ion-tab tab="settings">
            <app-settings onSettingChanged={this.onSettingChanged.bind(this)}/>
          </ion-tab>
          <ion-tab tab="console">
            <console-component ref={(ref: any) => this.consoleElement = ref as any}/>
          </ion-tab>
          <ion-tab tab="chart">
            <temperature-chart ref={(el: HTMLTemperatureChartElement | undefined) => this.tempChart = el as HTMLTemperatureChartElement}/>
          </ion-tab>
          <ion-tab-bar slot="bottom">
            <ion-tab-button tab="abc">
              <ion-icon name="thermometer-outline"/>
              <ion-label>Temp</ion-label>
              {/*<ion-badge>6</ion-badge>*/}
            </ion-tab-button>

            <ion-tab-button tab="settings">
              <ion-icon name="cog-outline"/>
              <ion-label>Settings</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="console">
              <ion-icon name="warning-outline"/>
              <ion-label>Console</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="chart">
              <ion-icon name="analytics-outline"></ion-icon>
              <ion-label>Chart</ion-label>
            </ion-tab-button>
          </ion-tab-bar>

        </ion-tabs>

      </ion-content>
    ];
  }

  disconnectedCallback(): void {
    this.killReading$.next();
    this.tempReaderService.killReading();
  }

  private async registerPhoneAppOnlyPlugins(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Plugins.KeepAwake.keepAwake();
    } catch (e) {
      console.warn([`Not valid on phone register feature`, e.toString()].join('\n'));
    }
  }

  private async logInfoMsg(msg: string): Promise<void> {
    const log = new Log();
    log.time = new Date();
    log.type = 'INFO';
    log.value = msg;
    await this.consoleElement.update(log);
  }

  private startReadingTemp(): void {

    let readingStarted = false;
    let counter: number = 1;
    this.tempReaderService.getCurrentTemperature().pipe(
      filter(() => this.backgroundService.appInForeground),
      filter((val: number | void) => !!val),
      takeUntil(this.killReading$)
    ).subscribe({
      next: async (temp: number) => {
        counter++;

        if (!this.currentTemp && temp) {
          await this.logInfoMsg('First temperature came in, looks good.');
        } else if (!this.sensorOnline) {
          await this.logInfoMsg('Back Online.');
        }

        if (counter % 60 === 0) {
          await this.logInfoMsg(`Current temperature: ${temp}`);
          await this.notificationService.sendNotificationIfNecessary(this.currentTemp, Settings, this.consoleElement);
        }

        this.sensorOnline = true;
        this.currentTemp = temp;
        this.keeper.currentTemp = temp;

        this.tempChart.addPoint(Date.now(), temp);

        const tempInRangeBefore = this.tempInRange;
        this.tempInRange = temp <= Settings.maxTemp && temp >= Settings.minTemp;
        if (!tempInRangeBefore && this.tempInRange) {
          this.notificationService.allowNotification();
          await this.logInfoMsg('Temperature back in range');
        }

        await this.updateGauge();

        if (!readingStarted) {
          readingStarted = true;
          this.keeper.reading$.next(Settings.useAsThermostat);
        }

        forceUpdate(this.el);
      },
      error: async (msg: string | Error) => {
        this.sensorOnline = false;
        await this.showError(msg);
        forceUpdate(this.el);

        setTimeout(() => {
          this.startReadingTemp();
          this.tempReaderService.startReadingTemp();
        }, 3000);
      }
    });

  }

  private manageDevice(): void {
    this.keeper.run().pipe(
      filter(() => this.backgroundService.appInForeground)
    ).subscribe({
      next: async (devicePower: IPowerChangeResponse) => {
        this.devicePower = devicePower;
        forceUpdate(this.el);
      },
      error: async (msg: string | Error) => {
        this.sensorOnline = false;
        await this.showError(msg);
        forceUpdate(this.el);

        setTimeout(() => {
          this.manageDevice();
          this.keeper.reading$.next(true);
        }, 30000);
      }
    });
  }

  private async updateGauge(): Promise<void> {
    if (!this.backgroundService.appInForeground) {
      return;
    }
    const sensor = this.el.querySelector<HTMLSensorTempElement>(`sensor-temp`);

    await sensor.update();
  }

  private async onSettingChanged(): Promise<void> {

    if (Settings.useAsThermostat) {
      this.keeper.reading$.next(!Settings.readonlyAppMode);
    } else {
      this.keeper.reading$.next(false);
    }
  }

  private async showError(msg: string | Error): Promise<any> {
    const log = new Log();
    log.time = new Date();
    log.type = 'ERROR';
    log.value = msg instanceof Error ? `${msg.message} \n ${msg.stack}` : msg;
    console.error(log.value);
    await this.consoleElement.update(log);
  }

  private async tabChanged(ev: CustomEvent<{ tab: string }>): Promise<void> {
    if (ev.detail.tab === 'chart') {
      await this.tempChart.viewOn();
    } else {
      await this.tempChart.viewOff();
    }

    if (ev.detail.tab === 'console') {
      await this.consoleElement.viewOn();
    } else {
      await this.consoleElement.viewOff();
    }
  }

  private checkIfToggleDarkTheme(): void {

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const shouldToggleDark = (prefersDark: boolean) => {
      if (prefersDark && Settings.appTheme === AppThemeSetting.SystemDefault) {
        return true;
      }
      return Settings.appTheme === AppThemeSetting.Dark;
    };

    this.toggleDarkTheme(shouldToggleDark(prefersDark.matches));

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addListener((mediaQuery: MediaQueryListEvent) => this.toggleDarkTheme(shouldToggleDark(mediaQuery.matches)));
  }

  private async askForReadOnlyMode(): Promise<void> {
    const alert = await alertController.create({
      backdropDismiss: false,
      message: 'Should app be in read only mode ?',
      inputs: [
        {
          type: 'checkbox',
          label: `Yes`,
          value: 'readonlyMode',
          checked: Settings.readonlyAppMode,
        },
        {
          type: 'checkbox',
          label: `Don't show again`,
          value: 'dontShowAgain',
          checked: false,
        }
      ],
      buttons: [
        {
          text: 'Close it',
          cssClass: 'primary',
          handler: (data: string[]) => {
            Settings.dontShowViewModeChooser = data.includes('dontShowAgain');
            Settings.readonlyAppMode = data.includes('readonlyMode');

            alert.dismiss();
          }
        }
      ]
    });

    return alert.present();
  }

  private toggleDarkTheme(shouldAdd: boolean): void {
    document.body.classList.toggle('dark', shouldAdd);
  }
}

