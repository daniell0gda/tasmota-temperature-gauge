import Push from 'push.js';
import {AppSettings} from '../../global/settings';
import {Log} from '../console-component/model';
import {AndroidNotificationsService} from './androidNotificationsService';


export class NotificationService {

  sendNotification: boolean = true;
  androidNotification: AndroidNotificationsService = new AndroidNotificationsService();

  async sendNotificationIfNecessary(temp: number, settings: AppSettings, consoleElement: HTMLConsoleComponentElement): Promise<void> {

    const log = new Log();
    log.time = new Date();
    log.type = 'ERROR';

    if (temp > settings.maxTemp) {
      const toHighMsg = `'Temperature is higher than ${settings.maxTemp}'`;
      this.sendDesctopNotification('Temperature Alert', toHighMsg);
      log.value = toHighMsg;
      await consoleElement.update(log);
    } else if (temp < settings.minTemp) {
      const toLowMsg = `'Temperature is lower than ${settings.minTemp}'`;
      log.value = toLowMsg;
      this.sendDesctopNotification('Temperature Alert', toLowMsg);
      await consoleElement.update(log);
    }
  }

  allowNotification(): void {
    this.sendNotification = true;
  }


  async askForPermissions(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') {
      return Promise.resolve('denied' as NotificationPermission);
    }

    if (Notification.permission === 'granted') {
      return Promise.resolve('granted');
    }
    if (Notification.permission !== 'denied') {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  private async sendDesctopNotification(title: string, notificationContent: string): Promise<any> {
    if (typeof Notification === 'undefined') {
      return this.androidNotification.send(title, notificationContent);
    }

    if (Notification?.permission !== 'granted') {
      return;
    }
    if (!this.sendNotification) {
      return Promise.resolve();
    }
    this.sendNotification = false;
    return Push.create(title, {
      body: notificationContent,
      requireInteraction: true,
      tag: 'Temperature'
    });
  }
}
