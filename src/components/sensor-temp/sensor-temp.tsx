import {Component, Element, h, Method, Prop} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';

@Component({
  tag: 'sensor-temp',
  styleUrl: 'sensor-temp.scss'
})
export class SensorTemp {

  @Element() el: HTMLStencilElement;

  @Prop() val: number;
  @Prop() min: number;
  @Prop() max: number;

  thermometerElement: HTMLThermometerGaugeElement;

  async componentDidLoad(): Promise<void> {

  }

  render(): any {
    return <thermometer-gauge ref={(ref: any) => this.thermometerElement = ref as any}/>;
  }

  @Method()
  async update(): Promise<void> {
    const gaugeElement = this.el.querySelector<HTMLThermometerGaugeElement>('thermometer-gauge');
    await gaugeElement.update(this.val, this.min, this.max);
  }
}
