import { Toast } from '@capacitor/toast';
import moment from 'moment';

export class AndroidNotificationsService {

  lastNotification: Date;

  async send(title: string, message: string): Promise<void> {
    return Toast.show({
      position: 'top',
      duration: 'long',
      text: `${title}. ${message}`
    });
  }

  canSendNotification(date: Date): boolean {
    return moment(date).add(1, 'h').isBefore(new Date());
  }
}
