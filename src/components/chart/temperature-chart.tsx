import {Component, Element, forceUpdate, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {SensorStorage} from '../../global/sensorStorage';
// tslint:disable-next-line:no-duplicate-imports
import {iif, interval, NEVER, Subject} from 'rxjs';
import {mergeMap, startWith, switchMap, takeUntil, takeWhile} from 'rxjs/operators';
import {fromPromise} from 'rxjs/internal-compatibility';
import {Color, loadingController} from '@ionic/core';
import Highcharts, {Chart} from 'highcharts';
import darkTheme from 'highcharts/themes/dark-unica';
import {mean, round, sortBy} from 'lodash';
import {ITempLog} from '../app-home/model';
import moment from 'moment';


@Component({
  tag: 'temperature-chart',
})
export class TemperatureChart {

  @Element() el: HTMLStencilElement;
  @Prop() _temps: string = '';
  @Prop() _min: number = 10;
  @Prop() _max: number = 30;
  chartData: [unknown, (number | null)][] = [];
  loading?: HTMLIonLoadingElement;
  private storage: SensorStorage = new SensorStorage();

  private refreshView$: Subject<boolean> = new Subject<boolean>();
  private componentIsDead$: Subject<boolean> = new Subject<boolean>();
  private shouldRefresh: boolean = false;
  private tickSize: 'hour' | 'day' | 'all' = 'hour';
  private higchart: Chart;

  async componentWillLoad(): Promise<void> {
    this.refreshView$.pipe(
      mergeMap((shouldRefresh: boolean) => {
        return iif(() => shouldRefresh, interval(30000).pipe(
          takeWhile(() => this.shouldRefresh),
          startWith(0),
          switchMap(() => fromPromise(this.refreshView()))
        ), NEVER);
      }),
      takeWhile(() => this.shouldRefresh),
      takeUntil(this.componentIsDead$)
    ).subscribe();
  }

  async componentDidLoad(): Promise<void> {
    window.addEventListener('resize', () => {
      setTimeout(() => {
        this.setChartSize();
      });
    });
    await this.setMainChart(this.chartData);
    const loader = setInterval(() => {
      if (document.readyState !== 'complete') return;
      clearInterval(loader);
      this.setChartSize();
    }, 150);
  }

  async componentDidRender(): Promise<void> {

  }

  disconnectedCallback(): void {
    this.componentIsDead$.next();
  }

  render(): any {
    return <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
      <div class="log-buttons">
        <ion-chip onClick={() => this.setTickSizeHour()} color={this.chipColorGet('hour')}>
          <ion-icon name="checkmark-circle-outline" hidden={this.tickSize !== 'hour'}></ion-icon>
          <ion-label>Hour</ion-label>
        </ion-chip>
        <ion-chip onClick={() => this.setTickSizeDay()} color={this.chipColorGet('day')}>
          <ion-icon name="checkmark-circle-outline" hidden={this.tickSize !== 'day'}></ion-icon>
          <ion-label>Day</ion-label>
        </ion-chip>
        <ion-chip onClick={() => this.setTickSizeAll()} color={this.chipColorGet('all')}>
          <ion-icon name="checkmark-circle-outline" hidden={this.tickSize !== 'all'}></ion-icon>
          <ion-label>All</ion-label>
        </ion-chip>
      </div>
      <div id="higChartContainer"
           style={{
             height: '400px',
             width: '100%'
           }}/>
    </Host>;
  }

  @Method()
  async viewOn(): Promise<void> {
    this.shouldRefresh = true;

    this.loading = await loadingController.create({
      spinner: 'circles',
      duration: 5000,
      message: 'loading..keep calm',
      translucent: true,
      backdropDismiss: true
    });
    await this.loading.present();

    this.refreshView$.next(true);
  }

  @Method()
  async viewOff(): Promise<void> {
    this.shouldRefresh = false;
    this.refreshView$.next(false);
  }

  // @Method()
  // async addPoint(date: number, temp: number): Promise<void> {
  //
  //   if (!this.shouldRefresh) {
  //     return;
  //   }
  //   this.higchart.series[0].addPoint([date, temp] as PointOptionsType);
  // }

  private async setChartSize(): Promise<void> {
    const buttons = this.el.querySelector('.log-buttons');
    if (!buttons) {
      return;
    }

    const appSize = document.querySelector('ion-app').clientWidth;

    this.higchart.update({
      chart: {
        width: appSize
      }
    }, false, false, false);
  }

  private async setMainChart(chartData: [unknown, number][]): Promise<void> {
    darkTheme(Highcharts);

    this.higchart = Highcharts.chart('higChartContainer', {
      chart: {
        type: 'line',
        zoomType: 'x',
      },
      title: {
        text: 'Temperatura w czasie'
      },
      subtitle: {
        text: document.ontouchstart === undefined ?
          'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
      },
      xAxis: {
        type: 'category'
      },
      yAxis: {
        title: {
          text: 'Temperatura ℃'
        }
      },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: {
              x1: 0,
              y1: 0,
              x2: 0,
              y2: 1
            },
            stops: [
              [0, Highcharts.getOptions().colors[0]],
              [1, Highcharts.color(Highcharts.getOptions().colors[0] as any).setOpacity(0).get('rgba') as any]
            ]
          },
          marker: {
            radius: 2
          },
          lineWidth: 1,
          states: {
            hover: {
              lineWidth: 1
            }
          },
          threshold: null
        }
      },
      series: [{
        id: 'tempSeries',
        name: 'Temp',
        type: 'area',
        data: chartData as any,
      }]
    }, () => {

    });

  }

  private async loadAllDataFromStorage(): Promise<void> {
    this.chartData = [];

    const logs = await this.storage.getTemperatures();
    delete logs['last'];
    const days = Object.values(logs);

    let counter = 0;
    let meanArray: number[] = [];
    for (const tick of days) {

      const hours = Object.values(tick);

      for (const hour of hours) {
        for (const iTempLog of hour as ITempLog[]) {
          meanArray.push(iTempLog.temp);
          counter++;
          if (counter >= 10) {
            const meanValue = round(mean(meanArray), 2);
            this.chartData.push([iTempLog.date, meanValue]);
            meanArray = [];
            counter = 0;
          }
        }
      }
    }
  }

  private async refreshView(refreshAll: boolean = false): Promise<void> {
    if (refreshAll) {
      await this.loadAllDataFromStorage();
    }

    if (this.tickSize !== 'all') {
      await this.calculateMeanTemps(this.tickSize);
      await this.loading.dismiss();

      this.higchart.series[0].setData(this.chartData as any);
    }
    await this.setChartSize();
  }

  private async setTickSizeHour(): Promise<void> {
    this.tickSize = 'hour';

    await this.calculateMeanTemps(this.tickSize);
    await this.updateSeries();

    forceUpdate(this.el);
  }


  private async setTickSizeDay(): Promise<void> {
    this.tickSize = 'day';

    await this.calculateMeanTemps('day');

    await this.updateSeries();

    forceUpdate(this.el);
  }

  private async setTickSizeAll(): Promise<void> {
    this.tickSize = 'all';
    forceUpdate(this.el);

    this.chartData = [];

    await this.calculateMeanTemps('day', false);
    await this.updateSeries();
  }

  private async calculateMeanTemps(unit: 'hour' | 'day', onlyThisMonth:boolean = true): Promise<void> {
    this.chartData = [];

    let logs = await this.storage.getTemperatures();
    delete logs['last'];
    const days = Object.values(logs);

    let toSort: {time:number, chartData:[unknown, number]}[] = [];

    for (const tick of days) {
      delete tick['processed'];

      const hours = Object.values(tick);

      if (unit === 'hour') {
        for (const hour of hours) {
          if (hour.length === 0) {
            continue;
          }
          const hours = hour.map((h: ITempLog) => h.temp);
          const newDate = moment(hour[0].date).minute(0).second(0).millisecond(0).toDate().getTime();
          this.chartData.push([moment(newDate).format('HH:MM'), round(mean(hours), 2)]);
        }

        // I want only hourly temps from one day
        break;
      }
      if (unit === 'day') {
        let ticks: number[] = [];
        for (const hour of hours) {
          if (hour.length === 0) {
            continue;
          }
          ticks = [...ticks, ...hour.map((h: ITempLog) => h.temp)];
        }

        let currentDay = hours[0][0].date;
        let thisMonth = moment(new Date()).month();
        let thisYear = moment(new Date()).year();

        if(onlyThisMonth)
        {
          let currMoment = moment(currentDay);
          if(currMoment.month() !== thisMonth || currMoment.year() !== thisYear){
            continue;
          }
        }


        const filtered = ticks.filter((tick: number) => !!tick);

        let dateStr= moment(currentDay).format('DD-MM-YYYY');
        let items:[unknown, number] = [dateStr, round(mean(filtered), 2)];
        toSort.push({time:currentDay, chartData:items});
      }
    }

    if(unit === 'day'){

      this.chartData = sortBy(toSort, 'time')
        .map((d: { time: number; chartData: [unknown, number] })=>d.chartData);
    }

  }
  private async updateSeries(): Promise<void> {
    this.higchart.series[0].setData(this.chartData as any);
  }

  private chipColorGet(tick: 'hour' | 'day' | 'week' | 'all'): Color | undefined {
    if (tick === this.tickSize) {
      return 'primary';
    }
    return undefined;
  }
}
