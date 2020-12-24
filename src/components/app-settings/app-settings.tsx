import {Component, Element, Event, EventEmitter, forceUpdate, h, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {fromEvent, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {AppSettings} from '../../global/settings';

@Component({
  tag: 'app-settings'
})
export class AppSettingsComponent {

  @Element() el: HTMLStencilElement;
  @Event() settingChanged: EventEmitter<void>;

  @Prop() val: number;

  settingPrefixKey: string = 'sonoff-th10-temp-url-address';
  settings: AppSettings = new AppSettings();
  private urlInput: HTMLIonInputElement;
  private minTempInput: HTMLIonInputElement;
  private maxTempInput: HTMLIonInputElement;

  private addressCorrect: boolean = true;

  componentWillLoad(): void {
    this.checkUrl(this.settings.urlValue);
  }

  componentDidRender(): void {
    console.log('sending notification');

    this.watchInputChange(this.urlInput).subscribe((value: string) => {

      if (this.checkUrl(value) || !value) {
        localStorage.setItem(`${this.settingPrefixKey}-url`, value);
        this.settings.urlValue = value;
        this.emitSettings();
      }
      forceUpdate(this.el);
    });

    this.watchInputChange(this.minTempInput).subscribe((value: string) => {
      this.settings.minTemp = +value;
      this.emitSettings();

    });

    this.watchInputChange(this.maxTempInput).subscribe((value: string) => {
      this.settings.maxTemp = +value;

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
                     value={this.settings.urlValue}/>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Min temp</ion-label>
          <ion-input type="number" ref={(el: HTMLIonInputElement) => this.minTempInput = el as any} value={this.settings.minTemp}/>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Max temp</ion-label>
          <ion-input type="number" ref={(el: HTMLIonInputElement) => this.maxTempInput = el as any} value={this.settings.maxTemp}/>
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

  private watchInputChange(input: HTMLIonInputElement): Observable<string> {
    return fromEvent(input, 'ionChange')
      .pipe(
        debounceTime(1000),
        filter((event: CustomEvent<{ value: string }>) => event !== undefined),
        map((event: CustomEvent<{ value: string }>) => event.detail.value),
        distinctUntilChanged()
      );
  }
}
