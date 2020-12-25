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

export interface IStateReponse {
  'Time': Date;
  'Uptime': Date;
  'UptimeSec': number;
  'Heap': number;
  'SleepMode': string;
  'Sleep': number;
  'LoadAvg': number;
  'MqttCount': number;
  'POWER': 'OFF' | 'ON';
  'Wifi': {
    'AP': number;
    'SSId': string;
    'BSSId': string;
    'Channel': number;
    'RSSI': number;
    'Signal': number;
    'LinkCount': number;
    'Downtime': string;
  };
}

export interface IPowerResponse {
  ButtonRetain: number;
  ButtonTopic: string[];
  FriendlyName: string[];
  LedMask: string;
  LedState: number;
  Module: number;
  Power: number;
  PowerOnState: number;
  PowerRetain: number;
  SaveData: number;
  SaveState: number;
  SensorRetain: number;
  SwitchMode: number[];
  SwitchRetain: string;
  SwitchTopic: string;
  Topic: string;
}

export interface IPowerStatusResponse {
  Status: IPowerResponse;
}

export interface IPowerChangeResponse {
  POWER: 'ON' | 'OFF';
}

export enum TypeKeys {
  SET_DAILY_REMINDER_TIME,
  SET_PENDING_NOTIFICATIONS,

}

export interface SetPendingNotifications {
  type: TypeKeys.SET_PENDING_NOTIFICATIONS;
  pendingNotifications: LocalNotificationPendingList;
}

export interface ITempLog {
  temp?: number;
  date?: Date;

  error?: string;
}
