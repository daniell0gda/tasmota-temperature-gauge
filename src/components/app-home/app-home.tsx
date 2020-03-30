import {Component, Element, forceUpdate, h} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {TempReaderService} from './tempReaderService';
import {filter} from 'rxjs/operators';
import {AppSettings} from '../../global/settings';
import {Log} from '../console-component/model';
import {NotificationService} from './notificationService';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss'
})
export class AppHome {

  @Element() el: HTMLStencilElement;

  sensorTempElement: HTMLSensorTempElement;
  consoleElement: HTMLConsoleComponentElement;
  tempReaderService: TempReaderService = new TempReaderService();
  notificationService: NotificationService = new NotificationService();
  currentTemp: number;
  sensorOnline: boolean = true;
  tempInRange: boolean = true;

  settings: AppSettings = new AppSettings();

  componentWillLoad(): void {
    (document.querySelector('#appSplashScreen') as HTMLElement).className += ' splashHide';
  }

  async componentDidLoad(): Promise<void> {
    await this.el.querySelector<HTMLIonTabsElement>('ion-tabs').select('abc');

    await this.logInfoMsg('App started successfully. Waiting for sensor to get first data..');
    await this.notificationService.askForPermissions();

    this.updateGauge();


    forceUpdate(this.el);
  }

  componentDidUnload(): void {
    this.tempReaderService.killReading();
  }

  render(): any[] {
    return [
      <ion-content>
        <ion-tabs>
          <ion-tab tab="abc">
            <sensor-temp class={!this.sensorOnline ? 'inactive' : ''}
                         ref={(ref: any) => this.sensorTempElement = ref as any}
                         val={this.currentTemp}
                         min={this.settings?.minTemp} max={this.settings?.maxTemp}/>
            <div class="dot alertDot" hidden={this.sensorOnline && this.tempInRange}/>
          </ion-tab>

          <ion-tab tab="settings">
            <app-settings onSettingChanged={this.onSettingChanged.bind(this)}/>
          </ion-tab>
          <ion-tab tab="console">
            <console-component ref={(ref: any) => this.consoleElement = ref as any}/>
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
          </ion-tab-bar>

        </ion-tabs>

      </ion-content>
    ];
  }

  private async logInfoMsg(msg: string): Promise<void> {
    const log = new Log();
    log.time = new Date();
    log.type = 'INFO';
    log.value = msg;
    await this.consoleElement.update(log);
  }

  private startReadingTemp(): void {
    this.tempReaderService.getCurrentTemperature().pipe(
      filter((val: number | void) => !!val)
    ).subscribe({
      next: async (temp: number) => {

        if (!this.currentTemp && temp) {
          await this.logInfoMsg('First temperature came in, looks good.');
        } else if (!this.sensorOnline) {
          await this.logInfoMsg('Back Online.');
        }

        this.sensorOnline = true;
        this.currentTemp = temp;

        const tempInRangeBefore = this.tempInRange;
        this.tempInRange = temp <= this.settings.maxTemp && temp >= this.settings.minTemp;
        if (!tempInRangeBefore && this.tempInRange) {
          this.notificationService.allowNotification();
          await this.logInfoMsg('Temperature back in range');
        }

        await this.notificationService.sendNotificationIfNecessary(this.currentTemp, this.settings, this.consoleElement);

        await this.updateGauge();

        forceUpdate(this.el);
      },
      error: async (msg: string | Error) => {
        this.sensorOnline = false;
        await this.showError(msg);
        forceUpdate(this.el);
      }
    });

    this.tempReaderService.startReadingTemp();
  }

  private async updateGauge(): Promise<void> {
    const sensor = this.el.querySelector<HTMLSensorTempElement>(`sensor-temp`);
    await sensor.update();
  }

  private async onSettingChanged(): Promise<void> {
    this.tempReaderService.tempAddress = this.settings.urlValue;

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

