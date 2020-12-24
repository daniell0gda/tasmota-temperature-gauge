import {Component, Element, h, Host, Method} from '@stencil/core';
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

  render(): any {
    return  <Host
      class={{
        'component-flex-container': true,
        'height-100': true
      }}
    >
      <div id="thermometer" class="displayCenter"/>
    </Host>;
  }
}
