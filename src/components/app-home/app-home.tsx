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
import {Plugins} from '@capacitor/core';

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

  componentWillLoad(): void {
    this.backgroundService = new BackgroundService();
    //TODO:
    // check how to handle background stuff, does it make sense in this scenario
    this.backgroundService.init();

    const appSplashScreen = (document.querySelector('#appSplashScreen') as HTMLElement);
    if (appSplashScreen) {
      appSplashScreen.className += ' splashHide';
    }
  }

  async componentDidLoad(): Promise<void> {
    await this.el.querySelector<HTMLIonTabsElement>('ion-tabs').select('abc');

    await this.logInfoMsg('App started successfully. Waiting for sensor to get first data..');
    await this.notificationService.askForPermissions();

    this.backgroundService.consoleFeed$.subscribe(async (log: Log) => {
      await this.consoleElement.update(log);
    });

    await this.updateGauge();

    forceUpdate(this.el);

    this.domReady.emit();

    await this.registerPhoneAppOnlyPlugins();
  }

  render(): any[] {
    return [
      <ion-content>
        <ion-tabs>
          <ion-tab tab="abc">
            <sensor-temp
              class={!this.sensorOnline ? 'inactive' : ''}
              ref={(ref: any) => this.sensorTempElement = ref as any}
              val={this.currentTemp}
              min={Settings.settings?.minTemp} max={Settings?.maxTemp}/>
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

  componentDidUnload(): void {
    this.killReading$.next();
    this.tempReaderService.killReading();
  }

  private async registerPhoneAppOnlyPlugins(): Promise<void> {
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
        }

        this.sensorOnline = true;
        this.currentTemp = temp;
        this.keeper.currentTemp = temp;

        const tempInRangeBefore = this.tempInRange;
        this.tempInRange = temp <= Settings.maxTemp && temp >= Settings.minTemp;
        if (!tempInRangeBefore && this.tempInRange) {
          this.notificationService.allowNotification();
          await this.logInfoMsg('Temperature back in range');
        }

        await this.notificationService.sendNotificationIfNecessary(this.currentTemp, Settings, this.consoleElement);

        await this.tempChart.update(temp, new Date());
        await this.updateGauge();

        if (!readingStarted) {
          readingStarted = true;
          this.manageDevice();
        }

        forceUpdate(this.el);
      },
      error: async (msg: string | Error) => {
        this.sensorOnline = false;
        await this.showError(msg);
        forceUpdate(this.el);

        setTimeout(() => {
          this.startReadingTemp();
        }, 3000);
      }
    });


    this.keeper.msgFeed.subscribe(async (msg: string) => {
      await this.logInfoMsg(msg);
    });

    this.tempReaderService.startReadingTemp();
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
    this.startReadingTemp();
  }

  private async showError(msg: string | Error): Promise<any> {
    const log = new Log();
    log.time = new Date();
    log.type = 'ERROR';
    log.value = msg instanceof Error ? msg.message : msg;
    await this.consoleElement.update(log);
  }
}

