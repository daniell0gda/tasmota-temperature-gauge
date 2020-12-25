import {Plugins} from '@capacitor/core';
import {ITempLog} from '../components/app-home/model';

const {Storage} = Plugins;

export class StorageService {


  errorStorageKey: string = 'sonoff-th10-temp-url-address-errors';

  constructor(public key: string = 'sonoff-th10-temp-url-address') {
    this.errorStorageKey = `${this.key}-errors`;
  }

  async store(log: ITempLog): Promise<ITempLog[]> {

    const logs = await this.getData(this.key);
    logs.push(log);

    await Storage.set({
      key: this.key,
      value: JSON.stringify(logs)
    });

    return logs;
  }

  async storeError(error: string, when: Date): Promise<ITempLog[]> {
    const logs = await this.getData(this.errorStorageKey);
    logs.push({
      error: error,
      date: when
    });

    await Storage.set({
      key: this.key,
      value: JSON.stringify(logs)
    });

    return logs;
  }

  async getErrors(): Promise<ITempLog[]> {
    return this.getData(this.errorStorageKey);
  }

  async getTemperatures(): Promise<ITempLog[]> {
    return this.getData(this.key);
  }

  private async getData(key: string): Promise<ITempLog[]> {
    const data = await Storage.get({key: key});
    if (data?.value) {
      return JSON.parse(data.value) as ITempLog[];
    }
    return [];
  }
}
