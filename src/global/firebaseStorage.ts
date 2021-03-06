import {ITempLog} from '../components/app-home/model';
import firebase from 'firebase/app';
import 'firebase/database';

import moment from 'moment';
import {ISettings} from './settings';
import {has, mean, round, set} from 'lodash';
import DataSnapshot = firebase.database.DataSnapshot;


export interface ITemps {

  [date: string]: IDateTemp;
}

interface IDateTemp {

  [hour: number]: ITempLog[];
}

interface ILastDate {
  lastDate?: string;
  lastHour?: number;
}

export class FirebaseStorage {
  tableName: string = 'temps';
  hook: number;

  lastDate: ILastDate;
  temps: ITemps = {};
  lastAllTempsRequest: Date;

  async initFireBase(): Promise<void> {
    let firebaseConfig = {
      apiKey: 'AIzaSyCA8GPuJd8rvmQitjH5CGSXHz-AAjjH2Ns',
      authDomain: 'tempreader-558d7.firebaseapp.com',
      databaseURL: 'https://tempreader-558d7-default-rtdb.europe-west1.firebasedatabase.app',
      projectId: 'tempreader-558d7',
      storageBucket: 'tempreader-558d7.appspot.com',
      messagingSenderId: '170271833173',
      appId: '1:170271833173:web:10227089c8e34ad11468dc',
      measurementId: 'G-85J8DHXQP3'
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
  }

  async storeTemp(date: number, temp: number): Promise<void> {
    if (!this.hook) {
      this.hook = date;
    }

    const sameDate = this.temps.lastDate === undefined || moment(date).isSame(this.temps.lastDate, 'day');

    const momentDate = moment(date);
    const dateKey = momentDate.format('DD-MM-yyyy');

    let dayCollection: IDateTemp = {};
    if (!sameDate || !this.temps[dateKey]) {
      dayCollection = this.temps[dateKey] = [];

    } else {
      dayCollection = this.temps[dateKey];
    }

    const sameHour = moment(date).isSame(this.hook, 'hour');
    const hourKey = momentDate.hour();
    let hourCollection: ITempLog[] = [];
    if (!sameHour || !dayCollection[hourKey]) {
      hourCollection = dayCollection[hourKey] = [];
    } else {
      hourCollection = dayCollection[hourKey];
    }

    this.hook = date;

    hourCollection.push({
      temp: temp, date: date
    });

    await this.setTemperatureLastDay({
      lastDate: dateKey,
      lastHour: hourKey
    });

    const firebasePath = this.hourKeyGet(dateKey, hourKey);

    console.log('firebase storing collection');
    return firebase.database().ref(firebasePath).set(hourCollection);
  }

  async getAllTemperatures(): Promise<ITemps> {

    if (this.lastAllTempsRequest && moment(this.lastAllTempsRequest).isSame(new Date(), 'hour')) {
      return this.temps;
    }

    const allTempsRef = 'temperatury';
    const allTemps = await new Promise(((resolve: (value?: (PromiseLike<ITemps> | ITemps)) => void) => {
      firebase.database().ref(allTempsRef).once('value', (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        this.temps = data;
        resolve(data);
      });
    }));

    const anyChanged = await this.setMeanHoursForOldDays(allTemps);
    if (anyChanged) {
      await firebase.database().ref(allTempsRef).set(allTemps);
    }

    this.lastAllTempsRequest = new Date();
    this.temps = allTemps;
    return allTemps;
  }

  async initLastHourCache(): Promise<ITemps> {
    if (!this.lastDate) {
      return {};
    }
    const firebasePath = this.hourKeyGet(this.lastDate.lastDate, this.lastDate.lastHour);
    return new Promise(((resolve: (value?: (PromiseLike<ITemps> | ITemps)) => void) => {
      firebase.database().ref(firebasePath).once('value', (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        this.setCacheOn(this.lastDate, data);
        resolve(data || []);
      });
    }));
  }

  /**
   * When was last day of read
   * @param last
   */
  async setTemperatureLastDay(last: ILastDate): Promise<any> {
    return firebase.database().ref(`temperatury/last`).set(last);
  }

  async initLastDay(): Promise<ILastDate> {
    return new Promise(((resolve: (value?: (PromiseLike<ILastDate> | ILastDate)) => void) => {
      firebase.database().ref(`temperatury/last`).once('value', (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        this.lastDate = data;
        resolve(data);
      });
    }));
  }

  async setSettings(settings: ISettings): Promise<any> {
    return firebase.database().ref('settings/th10-fridge').set(settings);
  }

  async getSettings(): Promise<ISettings> {
    return new Promise(((resolve: (value?: (PromiseLike<ISettings> | ISettings)) => void) => {
      firebase.database().ref(`settings/th10-fridge`).once('value', (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        this.lastDate = data;
        resolve(data || {});
      });
    }));
  }

  private async setMeanHoursForOldDays(allTemps: ITemps): Promise<boolean> {
    const last = allTemps['last'];
    delete allTemps['last'];

    const values = Object.values(allTemps);
    const days = Object.keys(allTemps);
    const daysLength = days.length;
    const maxToProcess = daysLength - 2;

    let anyChanged = false;
    for (let d = 0; d < maxToProcess; d++) {

      const day: IDateTemp = values[d];
      const hours = Object.keys(day);

      const dayKeyString = days[d];

      if (has(allTemps[dayKeyString], 'processed')) {
        continue;
      }

      anyChanged = true;


      let array_6 = [];
      let array_12 = [];
      let array_18 = [];
      let array_24 = [];
      for (const hourString of hours) {
        const hour = parseInt(hourString);
        if (hour <= 6) {
          array_6 = [...array_6, ...day[hourString].map((h: ITempLog) => h.temp)];
        } else if (hour <= 12) {
          array_12 = [...array_12, ...day[hourString].map((h: ITempLog) => h.temp)];
        } else if (hour <= 18) {
          array_18 = [...array_18, ...day[hourString].map((h: ITempLog) => h.temp)];
        } else if (hour <= 24) {
          array_24 = [...array_24, ...day[hourString].map((h: ITempLog) => h.temp)];
        }
      }

      const array_6_mean = round(mean(array_6), 2);
      const array_12_mean = round(mean(array_12), 2);
      const array_18_mean = round(mean(array_18), 2);
      const array_24_mean = round(mean(array_24), 2);

      allTemps[dayKeyString] = {
        6: array_6_mean ? [{
          temp: array_6_mean,
          date: moment(dayKeyString).hour(6).toDate().getTime()
        }] : [],
        12: array_12_mean ? [{
          temp: array_12_mean,
          date: moment(dayKeyString).hour(12).toDate().getTime()
        }] : [],
        18: array_18_mean ? [{
          temp: array_18_mean,
          date: moment(dayKeyString).hour(18).toDate().getTime()
        }] : [],
        24: array_24_mean ? [{
          temp: array_24_mean,
          date: moment(dayKeyString).hour(24).toDate().getTime()
        }] : []
      };

      set(allTemps[dayKeyString], 'processed', true);
    }
    allTemps['last'] = last;


    return anyChanged;
  }

  private setCacheOn(key: ILastDate, temps: ITempLog [] = []): void {
    if (!this.temps) {
      this.temps = {};
    }

    if (!this.temps[key.lastDate]) {
      this.temps[key.lastDate] = {};
    }

    if (!this.temps[key.lastDate][key.lastHour]) {
      this.temps[key.lastDate][key.lastHour] = [];
    }

    if (!temps) {
      temps = [];
    }
    this.temps[key.lastDate][key.lastHour] = temps;
  }

  private hourKeyGet(day: string, hour: number): string {
    return `temperatury/${day}/${hour}`;
  }

}
