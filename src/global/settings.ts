import {Plugins} from '@capacitor/core';
import {AppThemeSetting} from '../components/app-settings/model';
import {Subject} from 'rxjs';

const {Storage} = Plugins;

export interface ISettings {
  urlValue?: string;
  minTemp?: number;
  maxTemp?: number;
  turnOffMargin?: number;
  turnOnMargin?: number;
  useAsThermostat?: boolean;
  appTheme?: AppThemeSetting;
}

export class AppSettings {

  changed$: Subject<ISettings> = new Subject<ISettings>();
  settings: ISettings = {};
  private changed: boolean = false;

  constructor(public key: string = 'sonoff-th10-settings') {

  }

  get urlValue(): string {
    return this.settings?.urlValue;
  }

  set urlValue(value: string) {
    if (value !== this.settings.urlValue) {
      this.changed = true;
    }
    this.settings.urlValue = value;

    this.saveSettings();
  }

  get minTemp(): number | undefined {
    return this.settings?.minTemp;
  }

  set minTemp(value: number | undefined) {
    if (value !== this.settings.minTemp) {
      this.changed = true;
    }
    this.settings.minTemp = value;
    this.saveSettings();
  }

  get maxTemp(): number | undefined {
    return this.settings?.maxTemp;
  }

  set maxTemp(value: number | undefined) {
    if (value !== this.settings.maxTemp) {
      this.changed = true;
    }
    this.settings.maxTemp = value;
    this.saveSettings();
  }

  get useAsThermostat(): boolean {
    const value = this.settings?.useAsThermostat as any;
    return value === 'true' || value === true;
  }

  set useAsThermostat(value: boolean) {
    if (value !== this.settings.useAsThermostat) {
      this.changed = true;
    }
    this.settings.useAsThermostat = value;
    this.saveSettings();
  }

  get turnOffMargin(): number | undefined {
    return this.settings?.turnOffMargin || 0;
  }

  set turnOffMargin(value: number | undefined) {
    if (value !== this.settings.turnOffMargin) {
      this.changed = true;
    }
    this.settings.turnOffMargin = value;
    this.saveSettings();
  }

  get turnOnMargin(): number | undefined {
    return this.settings?.turnOnMargin || 0;
  }

  set turnOnMargin(value: number | undefined) {
    this.changed = value !== this.settings.turnOnMargin
    this.settings.turnOnMargin = value;
    this.saveSettings();
  }

  get appTheme(): AppThemeSetting | undefined {
    return this.settings?.appTheme || AppThemeSetting.SystemDefault;
  }

  set appTheme(value: AppThemeSetting | undefined) {
    this.changed =value !== this.settings.appTheme;
    this.settings.appTheme = value;
    this.saveSettings();
  }

  async updateSettings(): Promise<ISettings> {
    const data = await Storage.get({key: `${this.key}`});
    if (data.value) {
      this.settings = JSON.parse(data.value);
    } else {
      this.settings = {};
    }
    return this.settings;
  }

  private saveSettings(): void {
    Storage.set({
      key: this.key,
      value: JSON.stringify(this.settings)
    });

    if (this.changed) {
      this.changed$.next(this.settings);
    }
    this.changed = false;

  }
}
