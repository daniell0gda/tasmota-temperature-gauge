import {Component, Element, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import moment from 'moment';
import {SensorStorage} from '../../global/sensorStorage';
// tslint:disable-next-line:no-duplicate-imports
import ApexCharts, {ApexOptions} from 'apexcharts';

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

    this.series = [
      {
        name: 'Temp.℃',
        data: chartData
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
        type: 'x',
        enabled: true,
        autoScaleYaxis: true,
        zoomedArea: {
          fill: {
            color: '#90CAF9',
            opacity: 0.4
          },
          stroke: {
            color: '#0D47A1',
            opacity: 0.4,
            width: 1
          }
        }
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    };
    this.dataLabels = {
      enabled: false
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
        style: {
          colors: textColor
        }
      },
      tickPlacement: 'on'
    };
    this.tooltip = {
      shared: false,
      theme: theme
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

    } as ApexOptions);
    await this.mainChart.render();
  }
  private async loadDataFromStorage():Promise<void>{
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
}
