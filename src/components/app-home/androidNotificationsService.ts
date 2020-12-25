import {NotificationPermissionResponse, Plugins} from '@capacitor/core';
import moment from 'moment';

const {LocalNotifications} = Plugins;

export class AndroidNotificationsService {

  lastNotification: Date;

  async send(title: string, message: string): Promise<void> {

    const ifEnabled = await LocalNotifications.areEnabled();

    let result: NotificationPermissionResponse | undefined;
    if (!ifEnabled?.value) {
      result = await LocalNotifications.requestPermission();
    }
    if (ifEnabled?.value || result.granted) {
      let nowDate = new Date();

      if (!this.lastNotification ||  this.canSendNotification(this.lastNotification)) {
        console.log('lastNotification', `${Date.now()}, ${this.lastNotification?.getDate()}`);
        nowDate.setSeconds(nowDate.getSeconds() + 5);


        const id = Date.now();
        await LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: message,
              id: id,
              schedule: {
                at: nowDate
              },
              group: 'Temperature',
              groupSummary: true,
              autoCancel: true
            }
          ]
        });
        this.lastNotification = nowDate;
      }
    }
  }

  canSendNotification(date: Date): boolean {
    return moment(date).add(1, 'h').isBefore(new Date());
  }
}
