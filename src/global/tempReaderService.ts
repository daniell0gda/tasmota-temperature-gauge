import {interval, NEVER, Observable, Subject, throwError} from 'rxjs';

import {ISensorResponse} from '../components/app-home/model';
import {fromFetch} from 'rxjs/fetch';
import {catchError, exhaustMap, filter, map, mergeMap, switchMap, takeUntil, tap} from 'rxjs/operators';
import urljoin from 'url-join';

export class TempReaderService {

  sensorStateChanged: Subject<boolean>;
  reading$: Subject<boolean> = new Subject<boolean>();
  killReading$: Subject<boolean> = new Subject<boolean>();

  tempAddress: string = '';
  checkEvery: number = 2000;
  lastReading: number = 0;

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

  startReadingTemp(): void {
    this.reading$.next(true);
  }

  private pollData(): Observable<number | void> {
    const extracted = (val: boolean) => {
      return val ? interval(this.checkEvery).pipe(
        exhaustMap(() => this.readTemp())
      ) : NEVER;
    };

    return this.reading$.pipe(
      mergeMap((val: boolean) => {
        return extracted(val);
      })
    );
  }

  private readonly readTemp = () => {
//http://192.168.0.220/cm?cmnd=status%208

    if (!this.tempAddress) {
      return throwError('No address for temperature reading. Go to settings.');
    }

    this.reading$.next(false);

    const httpAddress = urljoin(this.tempAddress, '/cm?cmnd=status%208');
    return fromFetch(
      httpAddress,
      {
        method: 'GET',
        // mode: 'no-cors'
      }
    ).pipe(
      catchError((error: any) => {
        console.error(error);
        return throwError(['There is a problem with polling request (network problem).', error].join('; '));
      }),
      switchMap((response: Response) => {

        if (response.ok) {
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
      takeUntil(this.killReading$),
      tap((value: number) => {
        this.lastReading = value;
      })
    );
  };
}

