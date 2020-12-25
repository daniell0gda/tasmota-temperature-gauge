import {AppState, Plugins} from '@capacitor/core';
import {TempReaderService} from './tempReaderService';
import {TempKeeper} from './tempKeeper';
import {AppSettings} from './settings';
import {filter, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {NotificationService} from './notificationService';
import {ConsoleStorage} from './consoleStorage';

const {App, BackgroundTask} = Plugins;

export class BackgroundService {
  tempReaderService: TempReaderService = new TempReaderService();
  keeper: TempKeeper = new TempKeeper();
  settings: AppSettings = new AppSettings();
  killReading$: Subject<boolean> = new Subject<boolean>();
  notificationService: NotificationService = new NotificationService();
  stateActive: boolean = true;
  storage: ConsoleStorage = new ConsoleStorage();

  constructor() {
    this.tempReaderService.checkEvery = 30000;
  }

  run(): void {
    App.addListener('appStateChange', async (state: AppState) => {

      this.stateActive = state.isActive;

      if (!state.isActive) {
        await this.readTemp();

        let taskId = BackgroundTask.beforeExit(async () => {
          // In this function We might finish an upload, let a network request
          // finish, persist some data, or perform some other task


          // Must call in order to end our task otherwise
          // we risk our app being terminated, and possibly
          // being labeled as impacting battery life
          BackgroundTask.finish({
            taskId
          });
        });
      } else {
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
        await this.storage.store({
          temp: temp,
          date: new Date()
        });
        await this.notificationService.sendNotificationIfNecessary(temp, this.settings);
      },
      error: async (msg: string) => {
        await this.storage.storeError(msg, new Date());

        if (!this.stateActive) {
          setTimeout(() => {
            this.readTemp();
          }, 3000);
        }
      }
    });
  }
}
