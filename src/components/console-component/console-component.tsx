import {Component, Element, forceUpdate, h, Method} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Log} from './model';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
import {ITempLog} from '../app-home/model';
import {toastController} from '@ionic/core';

@Component({
  tag: 'console-component',
  styleUrl: 'console-component.scss'
})
export class ConsoleComponent {

  @Element() el: HTMLStencilElement;

  logs: Log[] = [];
  ionContent: HTMLIonContentElement;
  storage: SensorStorage = new SensorStorage();
  keepingDown: boolean = true;

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

    if (this.keepingDown) {
      setTimeout(async () => {
        await this.ionContent.scrollToBottom(300);
      });
    }
  }

  render(): any[] {
    return [
      <ion-content
        ref={(ref: any) => this.ionContent = ref as any}
        scrollEvents={true}
        onIonScrollEnd={() => this.onScrollEnd()}
      >
        {
          this.logs.map((log: Log) => <div class="logMessage ion-padding-top ion-padding-start">
            <ion-label color={this.logColorGet(log)} class="ion-padding-end">{this.timeFormat(log.time)}</ion-label>
            <ion-label>{log.value}</ion-label>
          </div>)
        }
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button onClick={() => this.keepingDownClick()}>
            <ion-icon name={this.keepingDown ? 'caret-down-circle-outline' : 'chevron-back-outline'}></ion-icon>
          </ion-fab-button>
        </ion-fab>
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

  private async keepingDownClick(): Promise<void> {
    this.keepingDown = !this.keepingDown;
    forceUpdate(this.el);
    await this.showScrollToastMsg();

  }

  private async showScrollToastMsg(): Promise<void> {
    const toast = await toastController.create({
      header: 'Console Tailing',
      message: this.keepingDown ? 'Automatic scrolling on' : 'Automatic scrolling off',
      position: 'top',
      buttons: [{
        text: 'Ok',
        role: 'cancel'
      }
      ],
      duration: 3000
    });
    await toast.present();
  }

  private async onScrollEnd(): Promise<void> {
    const scrollElement = await this.ionContent.getScrollElement();
    const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;

    const targetPercent = 80;

    let triggerDepth = ((scrollHeight / 100) * targetPercent);

    if (scrollElement.scrollTop > triggerDepth) {
      console.log(`Scrolled to ${targetPercent}%`);
    } else {
      this.keepingDown = false;
      forceUpdate(this.el);
      await this.showScrollToastMsg();
    }

  }
}
