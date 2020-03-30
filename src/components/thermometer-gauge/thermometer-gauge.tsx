import {Component, Element, h, Method} from '@stencil/core';
import {HTMLStencilElement} from '@stencil/core/internal';
import {ThermometerGaugeService} from './thermometer-gauge.service';
import {ThermometerSettings} from './model';


@Component({
  tag: 'thermometer-gauge',
  styleUrl: 'thermometer-gauge.scss'
})
export class ThermometerGauge {

  @Element() el: HTMLStencilElement;

  service: ThermometerGaugeService = new ThermometerGaugeService();
  settings: ThermometerSettings = new ThermometerSettings();

  componentWillLoad(): void {
    this.settings = new ThermometerSettings();
    this.settings.containerId = 'thermometer';
  }

  async componentDidLoad(): Promise<void> {
    this.service.init(20, this.settings);
  }

  @Method()
  async update(current: number, min: number, max: number): Promise<void> {
    this.settings.minTemp = min || 10;
    this.settings.maxTemp = max || 25;
    this.service.update(current, this.settings);
  }

  @Method()
  async changeSize(width?: number, height?: number): Promise<void> {
    await this.service.changeSize(width, height);
  }

  render(): any[] {
    return [
      <div id="thermometer" class="displayCenter"/>
    ];
  }
}
