import {Component, Element, h, Method, Prop} from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';


@Component({
  tag: 'sensor-temp',
  styleUrl: 'sensor-temp.scss'
})
export class SensorTemp {

  @Element() el: HTMLStencilElement;

  @Prop() val:number;
  @Prop() min:number;
  @Prop() max:number;


  render(): any[] {
    return [
      <ion-grid>
        <ion-row class="ion-align-items-center ion-justify-content-center">
          <ion-col class="ion-align-self-center">
            <thermometer-gauge/>
          </ion-col>
        </ion-row>
      </ion-grid>
    ];
  }

  @Method()
  async update():Promise<void>{
    const gaugeElement = this.el.querySelector<HTMLThermometerGaugeElement>('thermometer-gauge');
    await gaugeElement.update(this.val, this.min, this.max);
  }
}
