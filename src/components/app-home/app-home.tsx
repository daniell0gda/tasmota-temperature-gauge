import {Component, Element, forceUpdate, h} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {TempReaderService} from './tempReaderService';
import {filter} from 'rxjs/operators';
import {AppSettings} from '../../global/settings';
import {Log} from '../console-component/model';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.scss'
})
export class AppHome {

  @Element() el: HTMLStencilElement;

  sensorTempElement: HTMLSensorTempElement;
  consoleElement: HTMLConsoleComponentElement;
  service: TempReaderService = new TempReaderService();
  currentTemp: number;
  sensorNotWorking: boolean = false;

  settings: AppSettings = new AppSettings();

  componentWillLoad(): void {
    (document.querySelector('#appSplashScreen') as HTMLElement).className += ' splashHide';
  }

  async componentDidLoad(): Promise<void> {
    await this.el.querySelector<HTMLIonTabsElement>('ion-tabs').select('abc');
    this.updateGauge();
    forceUpdate(this.el);
  }

  componentDidUnload(): void {
    this.service.killReading();
  }

  render(): any[] {
    return [
      <ion-content>
        <ion-tabs>
          <ion-tab tab="abc">
            <sensor-temp class={this.sensorNotWorking ? 'inactive' : ''}
              ref={(ref: any) => this.sensorTempElement = ref as any}
              val={this.currentTemp}
              min={this.settings?.minTemp} max={this.settings?.maxTemp}/>
              <div class="dot alertDot" hidden={!this.sensorNotWorking}/>
          </ion-tab>

          <ion-tab tab="settings">
            <app-settings onSettingChanged={this.onSettingChanged.bind(this)}/>
          </ion-tab>
          <ion-tab tab="console">
            <console-component  ref={(ref: any) => this.consoleElement = ref as any}/>
          </ion-tab>
          <ion-tab-bar slot="bottom">
            <ion-tab-button tab="abc">
              <ion-icon name="thermometer-outline"/>
              <ion-label>Temp</ion-label>
              {/*<ion-badge>6</ion-badge>*/}
            </ion-tab-button>

            <ion-tab-button tab="settings">
              <ion-icon name="cog-outline"/>
              <ion-label>Ustawienia</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="console">
              <ion-icon name="warning-outline"/>
              <ion-label>Konsola</ion-label>
            </ion-tab-button>
          </ion-tab-bar>

        </ion-tabs>

      </ion-content>
    ];
  }

  private startReadingTemp(): void {
    this.service.getCurrentTemperature().pipe(
      filter((val: number | void) => !!val)
    ).subscribe({
      next: async (temp: number) => {
        this.sensorNotWorking = false;
        this.currentTemp = temp;


        await this.updateGauge();

        forceUpdate(this.el);
      },
      error: async (msg: string) => {
        this.sensorNotWorking = true;
        await this.showError(msg);
        forceUpdate(this.el);
      }
    });

    this.service.startReadingTemp();
  }

  private async updateGauge(): Promise<void> {
    const sensor = this.el.querySelector<HTMLSensorTempElement>(`sensor-temp`);
    await sensor.update();
  }

  private async onSettingChanged(): Promise<void> {
    this.service.tempAddress = this.settings.urlValue;

    this.startReadingTemp();
  }

  private async showError(msg: string): Promise<any> {
    const log = new Log();
    log.time = new Date();
    log.type = 'ERROR';
    log.value = msg;
    await this.consoleElement.update(log);
  }
}

