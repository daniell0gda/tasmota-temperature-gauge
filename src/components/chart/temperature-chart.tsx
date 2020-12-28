import {Component, Element, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
// tslint:disable-next-line:no-duplicate-imports
import ApexCharts, {ApexOptions} from 'apexcharts';
import {Settings} from '../my-app/settings';
import last from 'lodash/last';

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

  async componentWillLoad(): Promise<void> {
    await this.loadDataFromStorage();
  }

  async componentDidLoad(): Promise<void> {

    await this.setMainChart(this.chartData);
  }

  componentDidUnload(): void {

  }

  render(): any {
    return <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
      <div>
        <ion-button onClick={() => this.zoomOneHour()}>1h</ion-button>
        <ion-button onClick={() => this.zoomOneDay()}>1Day</ion-button>
        <ion-button onClick={() => this.zoomOneWeek()}>Week</ion-button>
        <ion-button onClick={() => this.resetZoom()}>All</ion-button>
      </div>
      <div ref={(el: HTMLDivElement | undefined) => this.chartDivElement = el as HTMLDivElement}/>
      <ion-button onClick={() => this.refreshView(true)}>Refresh View</ion-button>
    </Host>;
  }

  @Method()
  async update(temp: number, date: Date): Promise<void> {


    const diff = moment(date).diff(this.chartData[this.chartData.length - 1], 'minutes');
    if (diff >= 30 || this.chartData.length === 0) {
      this.chartData.push([date.getTime(), temp]);
      await this.refreshView();
    }
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
      height: 500,
      animations: {
        enabled: false
      },
      zoom: {
        autoScaleYaxis: true,
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    };
    this.dataLabels = {
      enabled: false,
    };
    this.markers = {
      size: 0
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
      },
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
          borderColor: dangerColor,
          label: {
            text: `Max Temp.`
          }
        },
        {
          y: Settings.minTemp,
          borderColor: dangerColor,
          label: {
            text: `Min Temp.`
          }
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

  private async loadDataFromStorage(): Promise<void> {
    this.chartData = [];

    const logs = await this.storage.getTemperatures();
    for (const log of logs) {

      this.chartData.push([log.date, log.temp]);
    }
  }

  private async refreshView(refreshAll: boolean = false): Promise<void> {
    if (refreshAll) {
      await this.loadDataFromStorage();
    }


    this.mainChart.appendSeries([{
      name: 'Temp.℃',
      data: this.chartData,
    }], false);
  }

  private zoomOneHour(): void {
    this.zoomWithMoment('hour');
  }

  private zoomOneDay(): void {
    this.zoomWithMoment('day');
  }

  private zoomOneWeek(): void {
    this.zoomWithMoment('week');
  }
  private zoomWithMoment(unit: 'hour'|'day'|'week'): void {
    if (this.chartData.length >= 2) {
      const lastLog = last(this.chartData);
      if (lastLog) {
        const hourAgo = moment(lastLog[0]).subtract(1, unit);
        this.mainChart.zoomX(hourAgo.toDate().getTime(), lastLog[0]);
      }
    }
  }

  private resetZoom(): void {
    if (this.chartData.length >= 2) {
      const lastLog = last(this.chartData);
      if (lastLog) {
        const first = this.chartData[0][0];
        this.mainChart.zoomX(first, lastLog[0]);
      }
    }
  }
}
