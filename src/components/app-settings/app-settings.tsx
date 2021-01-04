import {Component, Element, Event, EventEmitter, forceUpdate, h, Host, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {fromEvent, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {SelectChangeEventDetail, ToggleChangeEventDetail} from '@ionic/core';
import {Settings} from '../my-app/settings';
import {AppThemeSetting} from './model';

@Component({
  tag: 'app-settings'
})
export class AppSettingsComponent {

  @Element() el: HTMLStencilElement;
  @Event() settingChanged: EventEmitter<void>;

  @Prop() val: number;

  settingPrefixKey: string = 'sonoff-th10-temp-url-address';

  private urlInput: HTMLIonInputElement;
  private minTempInput: HTMLIonInputElement;
  private maxTempInput: HTMLIonInputElement;

  private addressCorrect: boolean = true;
  private turnOffMarginInput: HTMLIonInputElement | undefined;
  private turnOnMarginInput: HTMLIonInputElement | undefined;

  async componentWillLoad(): Promise<void> {
    this.checkUrl(Settings.urlValue);
    Settings.changed$.subscribe(() => {
      forceUpdate(this.el);
    });
  }

  componentDidRender(): void {
    console.log('sending notification');

    this.watchInputChange(this.urlInput).subscribe((value: string) => {

      if (this.checkUrl(value) || !value) {
        Settings.urlValue = value;
        this.emitSettings();
      }
      forceUpdate(this.el);
    });

    this.watchInputChange(this.minTempInput).subscribe((value: string) => {
      Settings.minTemp = +value;
      this.emitSettings();
    });

    this.watchInputChange(this.maxTempInput).subscribe((value: string) => {
      Settings.maxTemp = +value;
      this.emitSettings();
    });

    this.watchInputChange(this.turnOffMarginInput).subscribe((value: string) => {
      Settings.turnOffMargin = +value;

      this.emitSettings();
    });
    this.watchInputChange(this.turnOnMarginInput).subscribe((value: string) => {
      Settings.turnOnMargin = +value;

      this.emitSettings();
    });

    this.emitSettings();
  }

  render(): any {
    return <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
      <ion-content>
        <ion-list>
          <ion-item-divider>
            <ion-label>
              Device settings
            </ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-label position="stacked" color={this.addressCorrect ? '' : 'danger'}>
              {this.addressCorrect ? 'Http address' : 'Http address - Use something like http://192.168.3.94/'}
            </ion-label>
            <ion-input
              type="url"
              inputmode="url"
              placeholder="Http or Https.."
              ref={(el: HTMLIonInputElement) => this.urlInput = el as any}
              value={Settings.urlValue || 'http://'}/>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Min temp</ion-label>
            <ion-input type="number" ref={(el: HTMLIonInputElement) => this.minTempInput = el as any} value={Settings.minTemp}/>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Max temp</ion-label>
            <ion-input type="number" ref={(el: HTMLIonInputElement) => this.maxTempInput = el as any} value={Settings.maxTemp}/>
          </ion-item>
          <ion-item-divider>
            <ion-label>
              Device control
            </ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-label position="stacked">Use as a Thermostat</ion-label>
            <ion-toggle
              disabled={Settings.readonlyAppMode}
              checked={Settings.useAsThermostat as boolean}
              onIonChange={(ev: CustomEvent<ToggleChangeEventDetail>) => this.thermostatToggleChanged(ev.detail.checked)}/>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Turn Off Margin</ion-label>
            <ion-input type="number"
                       disabled={!Settings.useAsThermostat}
                       min="0"
                       ref={(el: HTMLIonInputElement) => this.turnOffMarginInput = el as any}
                       value={Settings.turnOffMargin}/>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Turn On Margin</ion-label>
            <ion-input type="number"
                       disabled={!Settings.useAsThermostat}
                       min="0"
                       ref={(el: HTMLIonInputElement) => this.turnOnMarginInput = el as any}
                       value={Settings.turnOnMargin}/>
          </ion-item>
          <ion-item-divider>
            <ion-label>
              App
            </ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-label>Theme</ion-label>
            <ion-select value={Settings.appTheme} okText="Okay" cancelText="Dismiss"
                        onIonChange={(ev: CustomEvent<SelectChangeEventDetail>) => this.appThemeChange(ev)}>
              <ion-select-option value={AppThemeSetting.Dark}>Dark</ion-select-option>
              <ion-select-option value={AppThemeSetting.Light}>Light</ion-select-option>
              <ion-select-option value={AppThemeSetting.SystemDefault}>System Default</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Readonly</ion-label>
            <ion-toggle
              checked={Settings.readonlyAppMode}
              onIonChange={(ev: CustomEvent<ToggleChangeEventDetail>) => this.readOnlyAppChanged(ev.detail.checked)}/>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Use local settings</ion-label>
            <ion-toggle
              checked={Settings.useLocalSettings}
              onIonChange={(ev: CustomEvent<ToggleChangeEventDetail>) => Settings.useLocalSettings = !!ev.detail.checked}/>
            <ion-button onClick={() => this.updateSettingsFromServer()} slot={'end'}>Update from Server</ion-button>
          </ion-item>
        </ion-list>
      </ion-content>
    </Host>;
  }

  private emitSettings(): void {

    this.settingChanged.emit();
  }

  private checkUrl(value: string): boolean {
    if (!value) {
      return;
    }

    let expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi;
    let regex = new RegExp(expression);

    this.addressCorrect = !!value.match(regex);

    return this.addressCorrect;
  }

  private watchInputChange(input: HTMLIonInputElement | HTMLIonToggleElement): Observable<string> {
    return fromEvent(input, 'ionChange')
      .pipe(
        debounceTime(1000),
        filter((event: CustomEvent<{ value: string }>) => event !== undefined),
        map((event: CustomEvent<{ value: string }>) => event.detail.value),
        distinctUntilChanged()
      );
  }

  private thermostatToggleChanged(detail: boolean): void {
    Settings.useAsThermostat = detail;

    this.emitSettings();
  }

  private appThemeChange(ev: CustomEvent<SelectChangeEventDetail>): void {
    Settings.appTheme = ev.detail.value as AppThemeSetting;

    this.emitSettings();
  }

  private readOnlyAppChanged(checked: boolean): void {
    Settings.readonlyAppMode = checked;

    this.emitSettings();
  }

  private async updateSettingsFromServer(): Promise<void> {
    return Settings.updateLocalSettingsFromServer();
  }
}
