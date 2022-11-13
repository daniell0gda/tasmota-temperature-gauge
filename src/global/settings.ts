import {AppThemeSetting} from '../components/app-settings/model';
import {Subject} from 'rxjs';
import {AppStorage} from '../components/my-app/settings';
import {extend} from 'lodash';

export interface ISettings {
  urlValue?: string;
  minTemp?: number;
  maxTemp?: number;
  turnOffMargin?: number;
  turnOnMargin?: number;
  useAsThermostat?: boolean;
  appTheme?: AppThemeSetting;
  readonlyAppMode?: boolean;
  dontShowViewModeChooser?: boolean;
}

export interface IPerAppSettings extends ISettings {
  useLocalSettings?: boolean;
}

export class AppSettings {
  changed$: Subject<ISettings> = new Subject<ISettings>();
  settingsFromServer: ISettings = {};
  /**
   * settings on browser local storage
   */
  localStorageSettings: ISettings = {};
  /**
   * Current used settings (from local storage or from db) plus others
   */
  currentSettingsPlus: IPerAppSettings = {};

  /**
   * Settings which are currently used, can be from db or from local storage.
   */
  usedSettings: ISettings = {};
  private changed: boolean = false;

  constructor(public key: string = 'sonoff-th10-settings') {

  }

  get useLocalSettings(): boolean {
    return localStorage.getItem(`${this.key}-use-local-settings`) === 'true';
  }

  set useLocalSettings(use: boolean) {

    if (use) {
      this.usedSettings = this.localStorageSettings;
    } else {
      this.usedSettings = this.settingsFromServer;
    }

    if (use !== this.useLocalSettings) {
      this.emitChanges();
    }

    localStorage.setItem(`${this.key}-use-local-settings`, `${!!use}`);
  }

  get urlValue(): string {
    return this.usedSettings?.urlValue;
  }

  set urlValue(value: string) {
    if (value !== this.usedSettings.urlValue) {
      this.changed = true;
    }
    this.usedSettings.urlValue = value;

    this.saveSettings();
  }

  get minTemp(): number | undefined {
    return this.usedSettings?.minTemp;
  }

  set minTemp(value: number | undefined) {
    if (value !== this.usedSettings.minTemp) {
      this.changed = true;
    }
    this.usedSettings.minTemp = value;
    this.saveSettings();
  }

  get maxTemp(): number | undefined {
    return this.usedSettings?.maxTemp;
  }

  set maxTemp(value: number | undefined) {
    if (value !== this.usedSettings.maxTemp) {
      this.changed = true;
    }
    this.usedSettings.maxTemp = value;
    this.saveSettings();
  }

  get useAsThermostat(): boolean {
    const value = this.usedSettings?.useAsThermostat as any;
    return value === 'true' || value === true;
  }

  set useAsThermostat(value: boolean) {
    if (value !== this.usedSettings.useAsThermostat) {
      this.changed = true;
    }
    this.usedSettings.useAsThermostat = value;
    this.saveSettings();
  }

  get turnOffMargin(): number | undefined {
    return this.usedSettings?.turnOffMargin || 0;
  }

  set turnOffMargin(value: number | undefined) {
    if (value !== this.usedSettings.turnOffMargin) {
      this.changed = true;
    }
    this.usedSettings.turnOffMargin = value;
    this.saveSettings();
  }

  get turnOnMargin(): number | undefined {
    return this.usedSettings?.turnOnMargin || 0;
  }

  set turnOnMargin(value: number | undefined) {
    this.changed = value !== this.usedSettings.turnOnMargin;
    this.usedSettings.turnOnMargin = value;
    this.saveSettings();
  }

  get appTheme(): AppThemeSetting | undefined {
    return this.usedSettings?.appTheme || AppThemeSetting.SystemDefault;
  }

  set appTheme(value: AppThemeSetting | undefined) {
    this.changed = value !== this.usedSettings.appTheme;
    this.usedSettings.appTheme = value;
    this.saveSettings();
  }

  get readonlyAppMode(): boolean {
    return (this.usedSettings.readonlyAppMode === 'true' as any) || !!this.usedSettings.readonlyAppMode;
  }

  set readonlyAppMode(mode: boolean) {
    if (mode !== this.usedSettings.readonlyAppMode) {
      this.changed = true;
    }
    this.usedSettings.readonlyAppMode = mode;
    this.saveSettings();
  }

  get dontShowViewModeChooser(): boolean {
    return (this.usedSettings.dontShowViewModeChooser as any) === 'true' || !!this.usedSettings.dontShowViewModeChooser;
  }

  set dontShowViewModeChooser(mode: boolean) {
    if (mode !== this.usedSettings.dontShowViewModeChooser) {
      this.changed = true;
    }
    this.usedSettings.dontShowViewModeChooser = !!mode;
    this.saveSettings();
  }

  async updateSettings(): Promise<ISettings> {

    this.settingsFromServer = await AppStorage.getSettings();


    if (!this.useLocalSettings) {
      this.usedSettings = this.settingsFromServer;
    } else {

      const item = localStorage.getItem(`${this.key}`);
      if (item) {
        this.localStorageSettings = JSON.parse(item);
        this.usedSettings = this.localStorageSettings;
      }
    }

    this.updatePerAppSettings();
    return this.usedSettings;
  }

  async updateLocalSettingsFromServer(): Promise<void> {
    this.settingsFromServer = await AppStorage.getSettings();

    if (JSON.stringify(this.localStorageSettings) !== JSON.stringify(this.settingsFromServer)) {
      this.changed = true;
    }
    this.localStorageSettings = this.settingsFromServer;

    if (this.useLocalSettings) {
      this.usedSettings = this.localStorageSettings;
    }
    this.saveLocalStorageSettings();

    this.changed = false;
  }

  private saveSettings(): void {

    if (this.useLocalSettings) {
      this.saveLocalStorageSettings();
    } else {
      AppStorage.setSettings(this.settingsFromServer).then(() => {
        if (this.changed) {
          this.emitChanges();
        }
        this.changed = false;
      });
    }
  }

  private saveLocalStorageSettings(): void {
    localStorage.setItem(this.key, JSON.stringify(this.localStorageSettings));
    if (this.changed) {
      this.emitChanges();
    }
    this.changed = false;
  }

  private emitChanges(): void {
    this.updatePerAppSettings();

    this.changed$.next(this.currentSettingsPlus);
  }

  private updatePerAppSettings(): void {
    this.currentSettingsPlus = extend(this.currentSettingsPlus, this.usedSettings);
    this.currentSettingsPlus.useLocalSettings = this.useLocalSettings;
  }
}
