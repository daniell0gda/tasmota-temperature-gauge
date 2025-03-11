import {ITempLog} from '../components/app-home/model';
import {ITemps} from './firebaseStorage';
import {AppStorage} from '../components/my-app/settings';
import {of, Subject} from 'rxjs';
import {bufferCount, catchError, exhaustMap, map, tap} from 'rxjs/operators';
import {mean, round} from 'lodash';
import {fromPromise} from 'rxjs/internal-compatibility';
import {GlobalConsole} from './globalConsole';
import moment from 'moment';

export class StorageService {

  errorStorageKey: string = 'sonoff-th10-temps-errors';
  afterInit: boolean = false;
  firstTime:boolean = true;

  store$: Subject<ITempLog> = new Subject<ITempLog>();

  constructor(public key: string = 'sonoff-th10-temps', public consoleService: GlobalConsole) {
    this.errorStorageKey = `${this.key}-errors`;

    this.store$.pipe(
      bufferCount(10),
      map((array: ITempLog[]) => {
        const temps = array.map((t: ITempLog) => t.temp);
        return {
          temp: round(mean(temps), 2),
          date: array[2].date
        } satisfies ITempLog;
      }),
      exhaustMap((log: ITempLog) => {
        this.logMsg(`[${moment(log.date).format('DD-MM HH:mm')}] Storing ${log.temp} Temp in firebase.. `);
        return fromPromise(AppStorage.storeTemp(log.date, log.temp));
      }),
      tap(() => {
        this.logMsg('Temp successfully updated in firebase');
      }),
      catchError((err: Error) => {
        this.errorMsg(`Failed to store error in db, ${err.message}`);
        return of('');
      })
    ).subscribe();
  }

  logMsg(str:string):void{

    if(this.firstTime){
      this.consoleService?.info(`Info: Logging temp update in db every 10 min.. (e.g. 16:10, 16:20).`);

      this.firstTime = false;
    }

    let minutes = new Date().getMinutes();

    if(minutes % 10 !== 0){
      return;
    }

    this.consoleService?.info(str);
  }

  errorMsg(str:string):void{
    this.consoleService?.error(str);
  }

  async init(): Promise<void> {
    await AppStorage.initLastDay();
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
