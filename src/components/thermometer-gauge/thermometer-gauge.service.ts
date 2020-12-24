import {ThermometerSettings} from './model';
import * as d3 from 'd3';

export class ThermometerGaugeService {
  private bottomY: number;
  private topY: number;
  private bulbRadius: number;
  private tubeWidth: number;
  private tubeBorderWidth: number;
  private mercuryColor: string;
  private innerBulbColor: string;
  private tubeBorderColor: string;
  private bulb_cy: number;
  private bulb_cx: number;
  private top_cy: number;

  private scale: d3.ScaleLinear<number, number>;
  private domain: number[] = [];

  /**
   * Scale step size
   */
  private step: number = 5;

  private settings: ThermometerSettings;
  private currentTemp: number;


  init(currentTemp: number, settings: ThermometerSettings = new ThermometerSettings()): void {
    this.currentTemp = currentTemp;
    this.settings = settings;
    this.bottomY = settings.height - 5;
    this.topY = 5;
    this.bulbRadius = 20;
    this.tubeWidth = 21.5;
    this.tubeBorderWidth = 1;
    this.mercuryColor = 'rgb(230,0,0)';
    this.innerBulbColor = 'rgb(230, 200, 200)';
    this.tubeBorderColor = '#999999';

    this.bulb_cy = this.bottomY - this.bulbRadius;
    this.bulb_cx = settings.width / 2;
    this.top_cy = this.topY + this.tubeWidth / 2;
    this.setDomain(settings);

    // D3 scale object
    this.scale = d3.scaleLinear()
      .range([this.bulb_cy - this.bulbRadius / 2 - 8.5, this.top_cy])
      .domain(this.domain);

    this.createThermo(settings.containerId);

  }

  update(currentTemp: number, settings: ThermometerSettings = new ThermometerSettings()): void {
    const {containerId, maxTemp, minTemp} = settings;

    const oldTemp = this.currentTemp;
    this.currentTemp = currentTemp;
    this.setDomain(this.settings);

    this.scale = d3.scaleLinear()
      .range([this.bulb_cy - this.bulbRadius / 2 - 8.5, this.top_cy])
      .domain(this.domain);

    let svg = d3.select(`#${containerId}`);

    const tubeFill_top = this.scale(this.currentTemp);
    const newHeight = this.bulb_cy - tubeFill_top;
    const oldHeight = this.bulb_cy - this.scale(oldTemp);

    svg.select('.rectMercury')
      .attr('height', oldHeight)
      .transition().duration(200)
      .attr('y', tubeFill_top)
      .attr('height', () => {
        return newHeight;
      });

    // Max and min temperature lines
    [minTemp, maxTemp].forEach((t: number) => {

      let isMax = (t === maxTemp),
        label = (isMax ? 'max' : 'min'),
        textOffset = (isMax ? -4 : 4);

      const val = this.scale(t);

      svg.select(`.${label}label`)
        .attr('y1', val)
        .attr('y2', val);

      svg.select(`.${label}text`)
        .attr('y', val + textOffset);
    });

    this.createOrUpdateScale(svg);
  }

  private setDomain(settings: ThermometerSettings): void {
    // Determine a suitable range of the temperature scale
    this.domain = [
      this.step * Math.floor(settings.minTemp / this.step),
      this.step * Math.ceil(settings.maxTemp / this.step)
    ];

    if (settings.minTemp - (this.domain)[0] < 0.66 * this.step)
      this.domain[0] -= this.step;

    if (this.domain[1] - settings.maxTemp < 0.66 * this.step)
      this.domain[1] += this.step;
  }

  private createThermo(containerId: string): void {

    d3.select(`#${containerId}`).select('svg').remove();

    let svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('height', this.settings.height)
      .attr('viewBox', '0 0 100 200');

    svg.attr('height', '100%');

    let defs = svg.append('defs');

    // Define the radial gradient for the bulb fill colour
    let bulbGradient = defs.append('radialGradient')
      .attr('id', 'bulbGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')
      .attr('fx', '50%')
      .attr('fy', '50%');

    bulbGradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', this.innerBulbColor);

    bulbGradient.append('stop')
      .attr('offset', '90%')
      .style('stop-color', this.mercuryColor);

    this.createCircle(svg);
    this.createTubeRect(svg);
    this.createWhiteTubeFill(svg);
    this.createMainBulb(svg);
    this.tubeFillColor(svg);

    this.createLines(svg);

    this.createRectMercury(svg);
    this.createMainThermometerBulbFill(svg);

    this.createScaleValues(svg);

  }

  private createScaleValues(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    let svgAxis = this.createOrUpdateScale(svg);

// Format text labels
    svgAxis.selectAll('.tick text')
      .style('font-size', '10px');

// Set main axis line to no stroke or fill
    svgAxis.select('path');
    svgAxis.select('path')
      .style('stroke', 'none')
      .style('fill', 'none');

// Set the style of the ticks
    svgAxis.selectAll('.tick line')
      .style('stroke', this.tubeBorderColor)
      .style('shape-rendering', 'crispEdges')
      .style('stroke-width', '1px');

  }

  private createOrUpdateScale(svg: d3.Selection<any, unknown, HTMLElement, any>): any {
    // Values to use along the scale ticks up the thermometer
    let tickValues = d3.range((this.domain[1] - this.domain[0]) / this.step + 1).map((v: number) => {
      return this.domain[0] + v * this.step;
    });


    // D3 axis object for the temperature scale
    let axis = d3.axisLeft(this.scale)
      .tickValues(tickValues);

    let svgAxis = svg.select('#tempScale');
    if (!svgAxis.node()) {
      svgAxis = svg.append('g')
        .attr('id', 'tempScale')
        .attr('transform', 'translate(' + (this.settings.width / 2 - this.tubeWidth / 2) + ',0)');
    }

    // Add the axis to the image
    svgAxis.call(axis);

    svgAxis.selectAll('.tick text').each((value: number, index, element: any) => {
      const array = element[index] as SVGTextElement;
      const node = d3.select(array);

      if (value >= this.settings.minTemp && value <= this.settings.maxTemp) {
        node.attr('fill', 'currentColor'); //currentColor
        return;
      }

      node.attr('fill', '#777777');
    });

    return svgAxis;
  }

  private createMainThermometerBulbFill(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    svg.append('circle')
      .attr('r', this.bulbRadius - 6)
      .attr('cx', this.bulb_cx)
      .attr('cy', this.bulb_cy)
      .style('fill', 'url(#bulbGradient)')
      .style('stroke', this.mercuryColor)
      .style('stroke-width', '2px');
  }

  private createRectMercury(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    let tubeFill_bottom = this.bulb_cy,
      tubeFill_top = this.scale(this.currentTemp);

    // Rect element for the red mercury column
    svg.append('rect')
      .attr('class', 'rectMercury')
      .attr('x', this.settings.width / 2 - (this.tubeWidth - 10) / 2)
      .attr('height', 0)
      .attr('width', this.tubeWidth - 10)
      .style('shape-rendering', 'crispEdges')
      .style('fill', this.mercuryColor)
      .attr('y', tubeFill_top)
      .attr('height', tubeFill_bottom - tubeFill_top);

  }

  private createLines(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    const {maxTemp, minTemp, width} = this.settings;

    // Max and min temperature lines
    [minTemp, maxTemp].forEach((t: number) => {

      let isMax = (t === maxTemp),
        label = (isMax ? 'max' : 'min'),
        textCol = (isMax ? 'rgb(230, 0, 0)' : 'yellow'),
        textOffset = (isMax ? -4 : 4);

      svg.append('line')
        .attr('class', `${label}label`)
        .attr('id', label + 'Line')
        .attr('x1', width / 2 - this.tubeWidth / 2)
        .attr('x2', width / 2 + this.tubeWidth / 2 + 22)
        .attr('y1', this.scale(t))
        .attr('y2', this.scale(t))
        .style('stroke', this.tubeBorderColor)
        .style('stroke-width', '1px')
        .style('shape-rendering', 'crispEdges');

      svg.append('text')
        .attr('class', `${label}text`)
        .attr('x', width / 2 + this.tubeWidth / 2 + 2)
        .attr('y', this.scale(t) + textOffset)
        .attr('dy', isMax ? null : '0.75em')
        .text(label)
        .style('fill', textCol)
        .style('font-size', '11px');
    });
  }

  private createCircle(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    // Circle element for rounded tube top
    svg.append('circle')
      .attr('r', this.tubeWidth / 2)
      .attr('cx', this.settings.width / 2)
      .attr('cy', this.top_cy)
      .style('fill', '#FFFFFF')
      .style('stroke', this.tubeBorderColor)
      .style('stroke-width', this.tubeBorderWidth + 'px');
  }

  private createTubeRect(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    // Circle element for rounded tube top
    svg.append('rect')
      .attr('x', this.settings.width / 2 - this.tubeWidth / 2)
      .attr('y', this.top_cy)
      .attr('height', this.bulb_cy - this.top_cy)
      .attr('width', this.tubeWidth)
      .style('shape-rendering', 'crispEdges')
      .style('fill', '#FFFFFF')
      .style('stroke', this.tubeBorderColor)
      .style('stroke-width', this.tubeBorderWidth + 'px');
  }

  private createWhiteTubeFill(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    // White fill for rounded tube top circle element
    // to hide the border at the top of the tube rect element
    svg.append('circle')
      .attr('r', this.tubeWidth / 2 - this.tubeBorderWidth / 2)
      .attr('cx', this.settings.width / 2)
      .attr('cy', this.top_cy)
      .style('fill', '#FFFFFF')
      .style('stroke', 'none');
  }

  private createMainBulb(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    // Main bulb of thermometer (empty), white fill
    svg.append('circle')
      .attr('r', this.bulbRadius)
      .attr('cx', this.bulb_cx)
      .attr('cy', this.bulb_cy)
      .style('fill', '#FFFFFF')
      .style('stroke', this.tubeBorderColor)
      .style('stroke-width', this.tubeBorderWidth + 'px');
  }

  private tubeFillColor(svg: d3.Selection<any, unknown, HTMLElement, any>): void {
    // Rect element for tube fill colour
    svg.append('rect')
      .attr('x', this.settings.width / 2 - (this.tubeWidth - this.tubeBorderWidth) / 2)
      .attr('y', this.top_cy)
      .attr('height', this.bulb_cy - this.top_cy)
      .attr('width', this.tubeWidth - this.tubeBorderWidth)
      .style('shape-rendering', 'crispEdges')
      .style('fill', '#FFFFFF')
      .style('stroke', 'none');
  }

}
