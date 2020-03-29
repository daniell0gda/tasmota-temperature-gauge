import {interval, NEVER, Observable, Subject, throwError} from 'rxjs';

import {ISensorResponse} from './model';
import {fromFetch} from 'rxjs/fetch';
import {filter, map, mergeMap, switchMap, takeUntil, tap} from 'rxjs/operators';
import urljoin from 'url-join';

export class TempReaderService {

  sensorStateChanged: Subject<boolean>;
  reading$: Subject<boolean> = new Subject<boolean>();
  killReading$: Subject<boolean> = new Subject<boolean>();

  tempAddress: string = '';
  checkEvery: number = 1000;

  constructor() {
    this.sensorStateChanged = new Subject();
  }

  getCurrentTemperature(): Observable<number | void> {

    return this.reading$.pipe(
      mergeMap((val: boolean) => {
        return val ? interval(this.checkEvery).pipe(
          mergeMap(() => this.readTemp())
        ) : NEVER;
      })
    );
  }

  stopReadingTemp(): void {
    this.reading$.next(false);
  }

  killReading(): void {
    this.killReading$.next(true);
  }

  startReadingTemp(): void {
    this.reading$.next(true);
  }

  private readonly readTemp = () => {
//http://192.168.0.220/cm?cmnd=status%208

    if (!this.tempAddress) {
      return throwError('No address for temperature reading. Go to settings.');
    }
    const httpAddress =  urljoin(this.tempAddress, '/cm?cmnd=status%208');
    return fromFetch(
      httpAddress,
      {
        method: 'GET',
        // mode: 'no-cors'
      }
    ).pipe(
      switchMap((response: Response) => {
        if (response.ok) {
          // OK return data
          return response.json();
        } else {
          // Server is returning a status requiring the client to try something else.
          return throwError(`Sonoff doesn't response..`);
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
      map((response: ISensorResponse) => response.StatusSNS.DS18B20.Temperature),
      takeUntil(this.killReading$)
    );
  };
}

