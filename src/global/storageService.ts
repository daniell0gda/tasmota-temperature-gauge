import {ITempLog} from '../components/app-home/model';
import {ITemps} from './firebaseStorage';
import {AppStorage} from '../components/my-app/settings';
import {Subject} from 'rxjs';
import {bufferCount, exhaustMap, map} from 'rxjs/operators';
import {mean, round} from 'lodash';
import {fromPromise} from 'rxjs/internal-compatibility';

export class StorageService {

  errorStorageKey: string = 'sonoff-th10-temps-errors';
  afterInit: boolean = false;

  store$: Subject<ITempLog> = new Subject<ITempLog>();

  constructor(public key: string = 'sonoff-th10-temps') {
    this.errorStorageKey = `${this.key}-errors`;

    this.store$.pipe(
      bufferCount(10),
      map((array: ITempLog[]) => {
        const temps = array.map((t: ITempLog) => t.temp);
        return {
          temp: round(mean(temps), 2),
          date: array[2].date
        } as ITempLog;
      }),
      exhaustMap((log:ITempLog)=>{
        return fromPromise(AppStorage.storeTemp(log.date, log.temp));
      })
    ).subscribe();
  }

  async init(): Promise<void> {
    await AppStorage.initLastDay();
    await AppStorage.initLastHourCache();
  }

  async getErrors(): Promise<ITempLog[]> {

    // return this.getData(this.errorStorageKey);
    return [];
  }

  async getTemperatures(): Promise<ITemps> {
    return this.getData();
  }

  private async getData(): Promise<ITemps> {
    return AppStorage.getAllTemperatures();
  }
}
