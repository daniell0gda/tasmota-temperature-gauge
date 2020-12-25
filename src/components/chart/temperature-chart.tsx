import {Component, Element, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';

import {ConsoleStorage} from '../../global/consoleStorage';
import ApexCharts from 'apexcharts';

@Component({
  tag: 'temperature-chart',
})
export class TemperatureChart {

  @Element() el: HTMLStencilElement;
  @Prop() _temps: string = '';
  @Prop() _min: number = 10;
  @Prop() _max: number = 30;
  chartData: number[][] = [];
  private storage: ConsoleStorage = new ConsoleStorage();
  private chartDivElement: HTMLDivElement | undefined;
  private chartScaleDivElement: HTMLDivElement | undefined;
  private mainChart:ApexCharts;
  private scaleChart:ApexCharts;

  async componentWillLoad(): Promise<void> {
    const logs = await this.storage.getTemperatures();
    for (const log of logs) {
      const point = [log.date.getTime(), log.temp];
      this.chartData.push(point);
    }
  }

  async componentDidLoad(): Promise<void> {

   setTimeout(async()=>{
     await this.setChartOptions(this.chartData);
     await this.setChartScale(this.chartData);
   });
  }

  componentDidUnload(): void {

  }

  render(): any {
    return <Host

    >
      <apex-chart
        type="bar"
        series={[{
          name: 'sales',
          data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
        }]}
        options={{
          xaxis: {
            categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999]
          }
        }}/>
      <div id="abc" ref={(el: HTMLDivElement | undefined) => this.chartDivElement = el as HTMLDivElement}/>
      <div id="abcc" ref={(el: HTMLDivElement | undefined) => this.chartScaleDivElement = el as HTMLDivElement}/>
    </Host>;
  }

  @Method()
  async update(temp: number, date: Date): Promise<void> {
    this.chartData.push([date.getTime(), temp]);
    this.mainChart.updateSeries([{
      name: 'Sales',
      data: this.chartData as any
    }]);
    this.scaleChart.updateSeries([{
      name: 'Sales',
      data: this.chartData as any
    }]);
  }

  private async setChartOptions(chartData: number[][]): Promise<void> {
    let options = {
      series: [{
        data: chartData
      }],
      chart: {
        id: 'chart2',
        type: 'line',
        height: 230,
        toolbar: {
          autoSelected: 'pan',
          show: false
        }
      },
      colors: ['#546E7A'],
      stroke: {
        width: 3
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 1,
      },
      markers: {
        size: 0
      },
      xaxis: {
        type: 'datetime'
      }
    };
    this.mainChart = new ApexCharts(this.chartDivElement, options);
    await this.mainChart.render();
  }
  private  async setChartScale(chartData: number[][]): Promise<void> {
    const optionsLine = {
      series: [{
        data: chartData
      }],
      chart: {
        id: 'chart1',
        height: 130,
        type: 'area',
        brush: {
          target: 'chart2',
          enabled: true
        },
        selection: {
          enabled: true,
          // xaxis: {
          //   min: new Date('19 Jun 2017').getTime(),
          //   max: new Date('14 Aug 2017').getTime()
          // }
        },
      },
      colors: ['#008FFB'],
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.91,
          opacityTo: 0.1,
        }
      },
      xaxis: {
        type: 'datetime',
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        tickAmount: 2
      }
    };

    this.scaleChart = new ApexCharts(this.chartScaleDivElement, optionsLine);
    await this.scaleChart.render();
  }
}
