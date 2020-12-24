import {LocalNotificationPendingList} from '@capacitor/core';

export interface ISensorValue {
  Temperature: number;
}

export interface ISensorResponseStatus {
  DS18B20: ISensorValue;
  Time: string;
}

export interface ISensorResponse {
  StatusSNS: ISensorResponseStatus;
  TempUnit: string;
}

export enum TypeKeys {
  SET_DAILY_REMINDER_TIME,
  SET_PENDING_NOTIFICATIONS,

}

export interface SetPendingNotifications {
  type: TypeKeys.SET_PENDING_NOTIFICATIONS;
  pendingNotifications: LocalNotificationPendingList;
}
