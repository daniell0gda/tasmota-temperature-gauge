import {Component, Element, forceUpdate, h, Method} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Log} from './model';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
import {ITempLog} from '../app-home/model';
import {toastController} from '@ionic/core';
import {iif, interval, NEVER, Subject} from 'rxjs';
import {mergeMap, startWith, takeUntil, takeWhile} from 'rxjs/operators';

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
  shouldRefresh: boolean = false;

  private trimConsole$: Subject<boolean> = new Subject<boolean>();
  private componentIsDead$: Subject<boolean> = new Subject<boolean>();

  async componentWillLoad(): Promise<void> {
    const logs = await this.storage.getErrors();
    logs.map((log: ITempLog) => {
      const newLog = new Log();
      newLog.type = 'ERROR';
      newLog.value = log.error;
      return newLog;
    });

    this.trimConsole$.pipe(
      mergeMap((shouldRefresh: boolean) => {
        return iif(() => shouldRefresh, interval(3000).pipe(
          takeWhile(() => this.shouldRefresh),
          startWith(0),
        ), NEVER);
      }),
      takeUntil(this.componentIsDead$)
    ).subscribe(() => {
      this.trimVisibleLogs();
      forceUpdate(this.el);
    });
  }

  async componentDidLoad(): Promise<void> {
    this.componentIsDead$.next(true);
  }

  @Method()
  async update(log: Log): Promise<void> {

    this.logs.push(log);

    if (this.shouldRefresh) {
      forceUpdate(this.el);
      if (this.keepingDown) {
        setTimeout(async () => {
          await this.ionContent.scrollToBottom(300);
        });
      }
    }

  }

  @Method()
  async viewOn(): Promise<void> {
    this.shouldRefresh = true;
    this.trimConsole$.next(true);

    setTimeout(()=>{
      forceUpdate(this.el);
    });
  }

  @Method()
  async viewOff(): Promise<void> {
    this.shouldRefresh = false;
    this.trimConsole$.next(false);
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
    if (!this.keepingDown) {
      return;
    }
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
