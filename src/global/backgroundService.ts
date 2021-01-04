import {App,} from '@capacitor/App';
import {TempReaderService} from './tempReaderService';
import {TempKeeper} from './tempKeeper';
import {AppSettings} from './settings';
import {filter, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotificationService} from './notificationService';
import {Log} from '../components/console-component/model';
import extend from 'lodash/extend';
import {AndroidNotificationsService} from '../components/app-home/androidNotificationsService';
import {AppState} from '@capacitor/app';


export class BackgroundService {
  tempReaderService: TempReaderService = new TempReaderService();
  keeper: TempKeeper = new TempKeeper();
  settings: AppSettings = new AppSettings();
  killReading$: Subject<boolean> = new Subject<boolean>();
  notificationService: NotificationService = new NotificationService();
  appInForeground: boolean = true;
  consoleFeed$: Subject<Log> = new Subject<Log>();
  androidNotification: AndroidNotificationsService = new AndroidNotificationsService();

  constructor() {
    this.tempReaderService.checkEvery = 30000;
  }

  init(): void {
    App.addListener('appStateChange', async (state: AppState) => {

      this.appInForeground = state.isActive;

      await this.androidNotification.send('app state change', `app changed to: ${this.appInForeground}`);

      if (!state.isActive) {

        this.consoleFeed$.next(extend(new Log(), {
          value: 'Switching to background',
          type: 'INFO',
          time: new Date()
        } as Log));

        await this.readTemp();

        //TODO: check how to do it in capacitor 3+u
        // let taskId = BackgroundTask.beforeExit(async () => {
        //   // In this function We might finish an upload, let a network request
        //   // finish, persist some data, or perform some other task
        //
        //
        //   // Must call in order to end our task otherwise
        //   // we risk our app being terminated, and possibly
        //   // being labeled as impacting battery life
        //   BackgroundTask.finish({
        //     taskId
        //   });
        // });
      } else {
        this.consoleFeed$.next(extend(new Log(), {
          value: 'Switching app to front',
          type: 'INFO',
          time: new Date()
        } as Log));
        this.killReading$.next(true);
      }
    });
  }

  private async readTemp(): Promise<void> {
    const currentState = await App.getState();
    if (currentState.isActive) {
      return;
    }

    this.tempReaderService.getCurrentTemperature().pipe(
      filter((val: number | void) => !!val),
      takeUntil(this.killReading$)
    ).subscribe({
      next: async (temp: number) => {
        this.keeper.tryToggleDevice(temp);
        await this.notificationService.sendNotificationIfNecessary(temp, this.settings);
      },
      error: async (err: string) => {
        this.consoleFeed$.next(extend(new Log(), {
          value: err,
          type: 'ERROR',
          time: new Date()
        } as Log));

        if (!this.appInForeground) {
          setTimeout(() => {
            this.readTemp();
          }, 3000);
        }
      }
    });
  }
}
