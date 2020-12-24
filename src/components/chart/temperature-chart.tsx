import {Component, Element, h, Host, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import Chart from 'chart.js';
import moment from 'moment';

@Component({
  tag: 'temperature-chart',
})
export class TemperatureChart {

  @Element() el: HTMLStencilElement;
  @Prop() _temps: string = '';
  @Prop() _min:number = 10;
  @Prop() _max:number = 30;
  private canvasElement: HTMLCanvasElement | undefined;
  private temperatures: number[] = [];
  private chart: Chart | undefined;

  componentDidLoad(): void {
    const ctx = this.canvasElement.getContext('2d');

    this.chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        datasets: [{
          label: 'Temperatura',

          borderColor: 'rgb(255, 99, 132)',

        }]
      },

      // Configuration options go here
      options: {
        scales: {
          x: {
            type: 'time',
            min: new Date('2019-01-01').valueOf(),
            max: new Date('2021-12-31').valueOf()
          },
          y: {
            type: 'linear',
            min: 0,
            max: 100
          }
        } as any
      }
    });
  }

  componentDidUnload(): void {
    this.chart.destroy();
  }

  render(): any {
    return <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
      <canvas ref={(el: HTMLCanvasElement | undefined) => this.canvasElement = el as HTMLCanvasElement}></canvas>
    </Host>;
  }

  @Method()
  async update(temp: number, date: Date): Promise<void> {
    this.chart.data.labels.push(moment(date).format('HH:mm:ss'));
    this.chart.data.datasets[0].data.push(temp);

    this.chart.update();
  }
}
