import {interval, Observable, Subject, throwError} from 'rxjs';

import {ISensorResponse} from '../components/app-home/model';
import {fromFetch} from 'rxjs/fetch';
import {catchError, distinctUntilChanged, exhaustMap, filter, map, startWith, switchMap, takeUntil, takeWhile, tap} from 'rxjs/operators';
import urljoin from 'url-join';
import {SensorStorage} from './sensorStorage';
import {Settings} from '../components/my-app/settings';

export class TempReaderService {

  sensorStateChanged: Subject<boolean>;
  reading$: Subject<boolean> = new Subject<boolean>();
  killReading$: Subject<boolean> = new Subject<boolean>();

  checkEvery: number = 2000;
  lastReading: number = 0;
  storage: SensorStorage = new SensorStorage();

  constructor() {
    this.sensorStateChanged = new Subject();
  }

  getCurrentTemperature(): Observable<number | void> {
    return this.pollData();
  }

  stopReadingTemp(): void {
    this.reading$.next(false);
  }

  killReading(): void {
    this.killReading$.next(true);
  }

  async startReadingTemp(): Promise<void> {
    await this.storage.init();
    this.reading$.next(true);
  }

  private pollData(): Observable<number | void> {

    return this.reading$.pipe(
      distinctUntilChanged(),
      exhaustMap((shouldRead: boolean) => {
        return interval(this.checkEvery).pipe(
          takeWhile(() => shouldRead),
          startWith(0),
          switchMap(() => this.readTemp())
        );
      })
    );
  }

  private readonly readTemp = () => {
//http://192.168.0.220/cm?cmnd=status%208

    if (!Settings.urlValue) {
      return throwError('No address for temperature reading. Go to settings.');
    }

    this.reading$.next(false);

    const httpAddress = urljoin(Settings.urlValue, '/cm?cmnd=status%208');
    return fromFetch(
      httpAddress,
      {
        method: 'GET',
        // mode: 'no-cors'
      }
    ).pipe(
      catchError(async (error: any) => {
        console.error(error);
        const msg = ['There is a problem with polling request (network problem).', error].join('; ');
        // await this.storage.storeError(msg, new Date());
        return throwError(msg);
      }),
      switchMap((response: Response) => {

        if (!response.json) {
          return throwError(JSON.stringify(response));
        }
        if (response.ok) {
          return response.json();
        } else {
          // Server is returning a status requiring the client to try something else.
          return throwError([`Sonoff doesn't response..`, response.json()].join('\n'));
        }
      }),

      filter((response: ISensorResponse) => {
        return !!response.StatusSNS;
      }),
      tap((response: ISensorResponse) => {
        if (response.StatusSNS?.DS18B20?.Temperature) {
          this.sensorStateChanged.next(true);
        } else {
          this.sensorStateChanged.next(false);
        }
      }),
      filter((response: ISensorResponse) => !!response.StatusSNS?.DS18B20?.Temperature),
      map((response: ISensorResponse) => response.StatusSNS.DS18B20.Temperature),
      takeUntil(this.killReading$),
      tap(async (value: number) => {
        this.lastReading = value;
        if (!Settings.readonlyAppMode) {
          this.storage.store$.next({
            temp: value,
            date: Date.now()
          });
        }
      })
    );
  }
}

