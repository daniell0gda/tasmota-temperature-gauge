import {Component, Element, Event, EventEmitter, forceUpdate, h, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {fromEvent, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ToggleChangeEventDetail} from '@ionic/core';
import {Settings} from '../my-app/settings';

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

  async componentWillLoad(): Promise<void> {
    this.checkUrl(Settings.urlValue);
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

    this.emitSettings();
  }

  render(): any[] {
    return [
      <ion-list>
        <ion-item>
          <ion-label position="stacked" color={this.addressCorrect ? '' : 'danger'}>
            {this.addressCorrect ? 'Http address' : 'Http address - Use something like http://192.168.3.94/'}
          </ion-label>
          <ion-input type="url" inputmode="url" placeholder="Http or Https.." ref={(el: HTMLIonInputElement) => this.urlInput = el as any}
                     value={Settings.urlValue}/>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Min temp</ion-label>
          <ion-input type="number" ref={(el: HTMLIonInputElement) => this.minTempInput = el as any} value={Settings.minTemp}/>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Max temp</ion-label>
          <ion-input type="number" ref={(el: HTMLIonInputElement) => this.maxTempInput = el as any} value={Settings.maxTemp}/>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Use as a Thermostat</ion-label>
          <ion-toggle
            checked={Settings.useAsThermostat as boolean}
            onIonChange={(ev: CustomEvent<ToggleChangeEventDetail>) => this.toggleChanged(ev.detail.checked)}/>
        </ion-item>
      </ion-list>
    ];
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

  private toggleChanged(detail: boolean): void {
    Settings.useAsThermostat = detail;
    this.emitSettings();
  }
}
