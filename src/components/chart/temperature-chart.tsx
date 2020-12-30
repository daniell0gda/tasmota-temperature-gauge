import {Component, Element, forceUpdate, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
// tslint:disable-next-line:no-duplicate-imports
import ApexCharts, {ApexOptions} from 'apexcharts';
import {Settings} from '../my-app/settings';
import {ChartOptions} from 'chart.js';
import {iif, interval, NEVER, Subject} from 'rxjs';
import {mergeMap, startWith, switchMap, takeUntil, takeWhile} from 'rxjs/operators';
import {fromPromise} from 'rxjs/internal-compatibility';
import {mean, round, last, first, max, min} from 'lodash';
import {Color} from '@ionic/core';

@Component({
  tag: 'temperature-chart',
})
export class TemperatureChart {

  @Element() el: HTMLStencilElement;
  @Prop() _temps: string = '';
  @Prop() _min: number = 10;
  @Prop() _max: number = 30;
  chartData: [number, (number | null)][] = [];
  private storage: SensorStorage = new SensorStorage();
  private chartDivElement: HTMLDivElement | undefined;
  private mainChart: ApexCharts;
  private series: ApexAxisChartSeries;
  private chart: ApexChart;
  private dataLabels: ApexDataLabels;
  private markers: ApexMarkers;
  private title: ApexTitleSubtitle;
  private fill: ApexFill;
  private yaxis: ApexYAxis;
  private xaxis: ApexXAxis;
  private tooltip: ApexTooltip;
  private refreshView$: Subject<boolean> = new Subject<boolean>();
  private componentIsDead$: Subject<boolean> = new Subject<boolean>();
  private shouldRefresh: boolean = false;
  private tickSize: 'hour' | 'day' | 'week' | 'all' = 'hour';

  constructor() {


  }

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
  }

  componentDidUnload(): void {
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
        <ion-chip onClick={() => this.setTickSizeWeek()} color={this.chipColorGet('week')}>
          <ion-icon name="checkmark-circle-outline" hidden={this.tickSize !== 'week'}></ion-icon>
          <ion-label>Week</ion-label>
        </ion-chip>
        <ion-chip onClick={() => this.setTickSizeAll()} color={this.chipColorGet('all')}>
          <ion-icon name="checkmark-circle-outline" hidden={this.tickSize !== 'all'}></ion-icon>
          <ion-label>All</ion-label>
        </ion-chip>
      </div>
      <div ref={(el: HTMLDivElement | undefined) => this.chartDivElement = el as HTMLDivElement}/>
    </Host>;
  }

  @Method()
  async viewOn(): Promise<void> {
    this.shouldRefresh = true;
    this.refreshView$.next(true);
  }

  @Method()
  async viewOff(): Promise<void> {
    this.shouldRefresh = false;
    this.refreshView$.next(false);
  }

  private async setChartSize(): Promise<void> {
    const buttons = this.el.querySelector('.log-buttons');
    if (!buttons) {
      return;
    }

    const appSize = document.querySelector('ion-app').clientHeight;
    const tabBarSize = document.querySelector('ion-tab-bar').clientHeight;
    const logButtonsSize = this.el.querySelector('.log-buttons').clientHeight;
    this.chart.height = appSize - tabBarSize - logButtonsSize;
    await this.mainChart.updateOptions({
      chart: this.chart
    } as ChartOptions);
  }

  private async setMainChart(chartData: [number, (number | null)][]): Promise<void> {
    const styles = getComputedStyle(document.querySelector('body'));
    const theme = document.querySelector('body').className.includes('dark') ? 'dark' : 'light';
    const textColor = styles.getPropertyValue('--ion-text-color').trim();
    const dangerColor = styles.getPropertyValue('--ion-color-danger').trim();


    this.series = [
      {
        name: 'Temp.℃',
        data: chartData,
      }
    ];
    this.chart = {
      type: 'area',
      stacked: false,
      animations: {
        enabled: false
      },
      height: 300,
      zoom: {
        type: 'y',
        enabled: true,
        autoScaleYaxis: false,
      },
      toolbar: {
        autoSelected: 'zoom'
      },
    };
    this.dataLabels = {
      enabled: false,
    };
    this.markers = {
      size: 0.6
    };
    this.title = {
      text: 'Temperatura w czasie',
      align: 'left'
    };
    this.fill = {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    };
    this.yaxis = {

      title: {
        text: 'Temp'
      }
    };
    this.xaxis = {
      type: 'datetime',
      title: {
        text: 'Kiedy'
      },
      labels: {
        format: 'dd MMM HH:mm',
        style: {
          colors: textColor
        }
      }
    };
    this.tooltip = {
      shared: false,
      theme: theme,
      x: {
        format: 'dd MMM HH:mm'
      }
    };

    const annotations: ApexAnnotations = {
      yaxis: [
        {
          y: Settings.maxTemp,
          borderColor: dangerColor || 'red',
          label: {
            text: `Max Temp.`,
            offsetY: -7,
          },
          borderWidth: 3,
          strokeDashArray: 3,
          opacity: 0.3
        },
        {
          y: Settings.minTemp,
          borderColor: dangerColor || 'red',
          borderWidth: 3,
          strokeDashArray: 3,
          label: {
            text: `Min Temp.`,
            offsetY: 20,
          },
          opacity: 0.3
        }
      ]
    };

    this.mainChart = new ApexCharts(this.chartDivElement, {
      tooltip: this.tooltip,
      xaxis: this.xaxis,
      yaxis: this.yaxis,
      fill: this.fill,
      title: this.title,
      markers: this.markers,
      dataLabels: this.dataLabels,
      chart: this.chart,
      series: this.series,
      annotations: annotations
    } as ApexOptions);
    await this.mainChart.render();
  }

  private async loadAllDataFromStorage(): Promise<void> {
    this.chartData = [];

    const logs = await this.storage.getTemperatures();
    for (const log of logs) {

      this.chartData.push([log.date, log.temp]);
    }
  }

  private async refreshView(refreshAll: boolean = false): Promise<void> {
    if (refreshAll) {
      await this.loadAllDataFromStorage();
    }

    if (this.tickSize !== 'all') {
      await this.calculateMeanTemps(this.tickSize);
    } else {
      await this.loadAllDataFromStorage();
    }

    setTimeout(async() => {
      await this.updateSeries();

      this.zoomWithMoment();
    });

    forceUpdate(this.el);
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

  private async setTickSizeWeek(): Promise<void> {
    this.tickSize = 'week';
    await this.calculateMeanTemps('week');
    await this.updateSeries();

    forceUpdate(this.el);
  }

  private async setTickSizeAll(): Promise<void> {
    this.tickSize = 'all';

    await this.loadAllDataFromStorage();
    await this.updateSeries();
    forceUpdate(this.el);
  }

  private async calculateMeanTemps(unit: 'hour' | 'day' | 'week'): Promise<void> {
    this.chartData = [];

    const logs = await this.storage.getTemperatures();
    let hook: number = logs[0].date;

    let temps: number[] = [];
    for (const log of logs) {
      if (!hook) {
        hook = log.date;
      }

      moment(log.date).minute(0).second(0);

      const sameHour = moment(log.date).isSame(hook, unit);
      const newDate = moment(log.date).minute(0).second(0).toDate().getTime();
      if (sameHour) {
        temps.push(log.temp);
      } else {

        this.chartData.push([newDate, round(mean(temps), 2)]);

        temps = [round(log.temp, 2)];
        hook = log.date;
      }
    }
    const newDate = moment(hook).minute(0).second(0).toDate().getTime();
    this.chartData.push([newDate, round(mean(temps), 2)]);
  }
  private async updateSeries(): Promise<void> {
    this.mainChart.updateSeries([{
      name: 'Temp.℃',
      data: this.chartData,
    }], false);

    await this.setNewMinMaxY();
  }
  private chipColorGet(tick: 'hour' | 'day' | 'week' | 'all'): Color | undefined {
    if (tick === this.tickSize) {
      return 'primary';
    }
    return undefined;
  }

  private zoomWithMoment(): void {
    if (this.chartData.length >= 2) {
      const lastLog = last(this.chartData);
      const firstLog = first(this.chartData);
      if (lastLog) {
        const startDate = moment(firstLog[0]).add(-3, 'hour');
        const endDate = moment(lastLog[0]).add(3, 'hour');

        this.mainChart.zoomX(startDate.toDate().getTime(), endDate.toDate().getTime());
      }
    }
  }

  private async setNewMinMaxY(): Promise<void> {
    const temps = this.chartData.map((val: [number, (number | null)])=> val[1]);
    const minTemp = min(temps);
    const maxTemp = max(temps);

    const newMinTemp = min([Settings.minTemp, minTemp]);
    const newMaxTemp = max([Settings.maxTemp, maxTemp]);
    this.yaxis.min = newMinTemp - 1;
    this.yaxis.max = newMaxTemp + 1;

    await this.mainChart.updateOptions({
      yaxis: this.yaxis,
    } as ChartOptions);
  }
}
