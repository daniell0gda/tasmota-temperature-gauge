import Push from 'push.js';
import {AppSettings} from '../../global/settings';
import {Log} from '../console-component/model';

export class NotificationService {

  sendNotification: boolean = true;

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
    if (!Notification) {
      alert('Desktop notifications not available in your browser. Try chrome.');
      return Promise.reject();
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
    if (Notification.permission !== 'granted') {
      throw new Error('Notification not granted');
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
