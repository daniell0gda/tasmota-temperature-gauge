export interface ILog {
  time: Date;
  value: string;
  type: 'INFO' | 'ERROR';
  temp: number;
}

export class Log implements ILog {
  time: Date;
  value: string;
  type: 'INFO' | 'ERROR';
  temp: number;
}
