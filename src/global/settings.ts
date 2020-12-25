import {Plugins} from '@capacitor/core';

const {Storage} = Plugins;

export interface ISettings {
  urlValue?: string;
  minTemp?: number;
  maxTemp?: number;
  useAsThermostat?: boolean;
}

export class AppSettings {

  settings: ISettings = {};

  constructor(public key: string = 'sonoff-th10-settings') {

  }

  get urlValue(): string {
    return this.settings?.urlValue;
  }

  set urlValue(value: string) {
    this.settings.urlValue = value;

    Storage.set({
      value: this.key,
      key: JSON.stringify(this.settings)
    });
  }

  get minTemp(): number | undefined {
    return this.settings?.minTemp;
  }

  set minTemp(value: number | undefined) {
    this.settings.minTemp = value;
  }

  get maxTemp(): number | undefined {
    return this.settings?.maxTemp;
  }

  set maxTemp(value: number | undefined) {
    this.settings.maxTemp = value;
  }

  get useAsThermostat(): boolean {
    const value = this.settings?.useAsThermostat as any;
    return value === 'true';
  }

  set useAsThermostat(value: boolean) {
    this.settings.useAsThermostat = value;
  }

  async updateSettings(): Promise<ISettings> {
    const data = await Storage.get({key: `${this.key}`});
    if (data.value) {
      this.settings = JSON.parse(data.value);
    }
    this.settings = {};
    return this.settings;
  }
}
