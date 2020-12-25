import {Component, Element, forceUpdate, h, Method} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Log} from './model';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
import {ITempLog} from '../app-home/model';

@Component({
  tag: 'console-component',
  styleUrl: 'console-component.scss'
})
export class ConsoleComponent {

  @Element() el: HTMLStencilElement;

  logs: Log[] = [];
  ionContent: HTMLIonContentElement;
  storage: SensorStorage = new SensorStorage();

  async componentWillLoad(): Promise<void> {
    const logs = await this.storage.getErrors();
    logs.map((log: ITempLog) => {
      const newLog = new Log();
      newLog.type = 'ERROR';
      newLog.value = log.error;
      return newLog;
    });

    this.trimVisibleLogs();
  }

  async componentDidLoad(): Promise<void> {

  }

  @Method()
  async update(log: Log): Promise<void> {

    this.trimVisibleLogs();

    this.logs.push(log);

    forceUpdate(this.el);
  }

  render(): any[] {
    return [
      <ion-content ref={(ref: any) => this.ionContent = ref as any} scrollEvents={true}>
        {
          this.logs.map((log: Log) => <div class="logMessage ion-padding-top ion-padding-start">
            <ion-label color={this.logColorGet(log)} class="ion-padding-end">{this.timeFormat(log.time)}</ion-label>
            <ion-label>{log.value}</ion-label>
          </div>)
        }
      </ion-content>
    ];
  }

  private trimVisibleLogs(): void {
    const logsLength = this.logs.length;
    if (logsLength > 1000) {
      this.logs.splice(0, logsLength - 1000);
    }
  }

  private timeFormat(date: Date): string {
    return moment(date).format('HH:mm:ss');
  }

  private logColorGet(log: Log): string {
    if (log.type === 'ERROR') {
      return 'danger';
    }
    return '';
  }
}
