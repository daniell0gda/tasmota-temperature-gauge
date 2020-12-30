import {fromFetch} from 'rxjs/fetch';
import {catchError, exhaustMap, filter, map, startWith, switchMap, takeUntil, takeWhile, tap} from 'rxjs/operators';
import {interval, NEVER, Observable, of, Subject, throwError} from 'rxjs';
import {IPowerChangeResponse, IPowerStatusResponse} from '../components/app-home/model';
import urljoin from 'url-join';
import {Settings} from '../components/my-app/settings';

export class TempKeeper {

  currentTemp: number;
  checkEvery: number = 10000;
  killReading$: Subject<boolean> = new Subject<boolean>();
  msgFeed: Subject<string> = new Subject<string>();
  lastStatus: IPowerChangeResponse;
  reading$: Subject<boolean> = new Subject<boolean>();

  start(): void {
    this.reading$.next(true);
  }

  run(): Observable<IPowerChangeResponse> {
    if (!Settings.useAsThermostat) {
      return NEVER;
    }

    return this.reading$.pipe(
      exhaustMap(() => {
        return interval(this.checkEvery).pipe(
          takeWhile(()=> Settings.useAsThermostat),
          startWith(0),
          switchMap(() => this.tryToggleDevice(this.currentTemp))
        );
      })
    );
  }

  tryToggleDevice(currentTemp: number): Observable<IPowerChangeResponse> {
    const {maxTemp, minTemp} = Settings;

    //TODO: heating?
    this.reading$.next(false);

    this.msgFeed.next(`Trying to toggle device: temp (${currentTemp})`);

    if ((currentTemp - Settings.turnOffMargin) <= minTemp) {
      return this.toggleDevice('Off');
    } else if ((currentTemp + Settings.turnOnMargin) > maxTemp) {
      return this.toggleDevice('On');
    }

    return this.isDeviceTurnedOn().pipe(
      map((turnedOn: boolean) => {
        return {
          POWER: turnedOn ? 'ON' : 'OFF'
        } as IPowerChangeResponse;
      }, tap((turnedOn: boolean) => {
        this.msgFeed.next(`Device is turn ${turnedOn ? 'ON' : 'OFF'}`);
      }))
    );
  }

  private toggleDevice(to: 'On' | 'Off'): Observable<IPowerChangeResponse> {

    const httpAddress = urljoin(Settings.urlValue, `/cm?cmnd=Power%20${to}`);

    return this.isDeviceTurnedOn().pipe(
      tap((turnedOn: boolean) => {
        this.msgFeed.next(`Device is turn ${turnedOn ? 'ON' : 'OFF'}`);
      }),
      exhaustMap((turnedOn: boolean) => {
        if ((to === 'On' && turnedOn) || (to === 'Off' && !turnedOn)) {
          this.msgFeed.next(`Trying to turn ${to} device - but it is already ${to}`);
          return of({
            POWER: turnedOn ? 'ON' : 'OFF'
          } as IPowerChangeResponse);
        }
        this.msgFeed.next(`Trying to turn ${to} device.`);
        return this.callDeviceSetStatus(httpAddress, to);
      }),
      tap((status: IPowerChangeResponse) => {
        this.lastStatus = status;
      })
    );

  }

  private callDeviceSetStatus(httpAddress: string, to: 'On' | 'Off'): Observable<IPowerChangeResponse> {
    return fromFetch(
      httpAddress,
      {
        method: 'GET',
        // mode: 'no-cors'
      }
    ).pipe(
      catchError((error: any) => {
        if (to === 'On') {
          return throwError(['Device cannot be turned on.', error].join('; '));
        }
        return throwError(['Device cannot be turned off', error].join('; '));
      }),
      switchMap((response: Response) => {

        if (response.ok) {
          return response.json();
        } else {
          // Server is returning a status requiring the client to try something else.
          return throwError(`Sonoff doesn't response..`);
        }
      }),
      filter((response: IPowerChangeResponse) => {
        return !!response.POWER;
      }),
      tap((response: IPowerChangeResponse) => {
        this.lastStatus = response;

        let result = false;
        if (to === 'On' && response.POWER === 'ON') {
          result = true;
        }
        if (to === 'Off' && response.POWER === 'OFF') {
          result = true;
        }

        this.msgFeed.next(`Changing device power to ${to}. Success: ${result}`);
      }),
      catchError((error: any) => {
        return throwError([`Error while turning ${to} device`, error].join('; '));
      }),
      takeUntil(this.killReading$)
    );
  }

  private isDeviceTurnedOn(): Observable<boolean> {
//http://192.168.0.220/cm?cmnd=status%208
    this.msgFeed.next(`Is device turned on?`);

    const url = Settings.urlValue;
    if (!url) {
      return throwError('No address for temperature reading. Go to settings.');
    }

    const httpAddress = urljoin(url, '/cm?cmnd=status%209');
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

      filter((response: IPowerStatusResponse) => {
        return !!response.Status;
      }),
      map((response: IPowerStatusResponse) => {
        return response.Status.Power !== 0;
      }),
      takeUntil(this.killReading$)
    );
  }
}
