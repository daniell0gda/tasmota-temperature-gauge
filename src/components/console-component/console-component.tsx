import {Component, Element, forceUpdate, h, Method} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {Log} from './model';
import moment from 'moment';

@Component({
  tag: 'console-component',
  styleUrl: 'console-component.scss'
})
export class ConsoleComponent {

  @Element() el: HTMLStencilElement;

  logs: Log[] = [];
  ionContent: HTMLIonContentElement;
  componentWillLoad(): void {
  }

  async componentDidLoad(): Promise<void> {

  }

  @Method()
  async update(log: Log): Promise<void> {
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
