import * as d3 from 'd3';


export class LiquidFillGaugeSettings {
    /**
     * The color of the outer circle.
     */
    circleColor: string = '#178BCA';

    /**
     * The size of the gap between the outer circle and wave circle as a percentage of the outer circles this.radius.
     * @default 0.05;
     */
    circleFillGap: number = 0.05;

    /**
     * The outer circle thickness as a percentage of it's this.radius.
     * @default 0.05;
     */
    circleThickness: number = 0.05;

    /**
     * If true then @param waveValue is manilupating wave height
     */
    distinctWaveFromGaugeValue: boolean = true;

    /**
     * Gauge height
     * @default 300
     */
    height: number = 300;

    /**
     * The gauge maximum value.
     * @default 100
     */
    maxValue: number = 100;
    /**
     * The gauge minimum value.
     * @default 0
     */
    minValue: number = 0;

    /**
     * If value is falsy (except 0) then string text will be set instead of number value
     */
    setStringTextValueWhenValueIsUknown: boolean = true;
    /**
     * The color of the value text when the wave does not overlap it.
     */
    textColor: string = '#045681';
    /**
     * The relative height of the text to display in the wave circle. 1 = 50%
     * @default 1
     */
    textSize: number = 1;

    /**
     * Text added to the value
     * @default '%';
     */
    textSuffix: string = '%';

    /**
     * The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
     * @default .5
     */
    textVertPosition: number = .5;

    /**
     * If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
     */
    valueCountUp: boolean = true;
    /**
     * Controls if the wave scrolls or is static.
     */
    waveAnimate: boolean = true;

    /**
     * The amount of time in milliseconds for a full wave to enter the wave circle.
     * @default 18000
     */
    waveAnimateTime: number = 18000;
    /**
     * The color of the fill wave.
     */
    waveColor: string = '#178BCA';

    /**
     * The number of full waves per width of the wave circle.
     * @default 1
     */
    waveCount: number = 1;

    /**
     * The wave height as a percentage of the this.radius of the wave circle.
     * @default 0.05;
     */
    waveHeight: number = 0.05;

    /**
     * Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill,
     * and minimum at 0% and 100% fill.
     * This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
     */
    waveHeightScaling: boolean = true;

    /**
     * The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
     * @default 0;
     */
    waveOffset: number = 0;

    /**
     * Control if the wave should rise from 0 to it's full height, or start at it's full height.
     */
    waveRise: boolean = true;

    /**
     * The amount of time in milliseconds for the wave to rise from 0 to it's final height.
     * @default 1000
     */
    waveRiseTime: number = 1000;
    /**
     * The color of the value text when the wave overlaps it.
     */
    waveTextColor: string = '#A4DBf8';

    waveValue: number = 0;
    /**
     * Gauge width
     * @default 300
     */
    width: number = 300;
}

let {
    select: d3Select, scaleLinear: d3ScaleLinear,
    arc: d3Arc, area: d3Area, active: d3Active,
    interpolate: d3Interpolate, easeLinear: d3EaseLinear,
} = d3;

export class Gauge {
    private get circleFillGap(): number {
        if (this._circleFillGap) {
            return this._circleFillGap;
        }
        this._circleFillGap = this.settings.circleFillGap * this.radius;
        return this._circleFillGap;
    }

    private get circleThickness(): number {
        if (this._circleThickness) {
            return this._circleThickness;
        }

        this._circleThickness = this.settings.circleThickness * this.radius;
        return this._circleThickness;
    }

    /**
     * Data for building the clip wave area.
     */
    private get data(): any[] {
        if (this._data) {
            return this._data;
        }

        let data = [];
        for (let i = 0; i <= 40 * this.waveClipCount; i++) {
            data.push({ x: i / (40 * this.waveClipCount), y: (i / (40)) });
        }
        this._data = data;
        return this._data;
    }

    private get fillCircleMargin(): number {
        if (this._fillCircleMargin) {
            return this._fillCircleMargin;
        }
        this._fillCircleMargin = this.circleThickness + this.circleFillGap;
        return this._fillCircleMargin;
    }

    private get fillCircleRadius(): number {
        if (this._fillCircleRadius) {
            return this._fillCircleRadius;
        }
        this._fillCircleRadius = this.radius - this.fillCircleMargin;
        return this._fillCircleRadius;
    }

    private get fillPercent(): number {
        if (this._fillPercent) {
            return this._fillPercent;
        }

        let val: number = this.settings.distinctWaveFromGaugeValue ? this.waveValue : this.initialValue;

        this._fillPercent = Math.max(this.settings.minValue, Math.min(this.settings.maxValue, val)) / this.settings.maxValue;
        return this._fillPercent;
    }

    private get locationX(): number {
        if (this._locationX) {
            return this._locationX;
        }

        this._locationX = this.settings.width / 2 - this.radius;
        return this._locationX;
    }

    private get locationY(): number {
        if (this._locationY) {
            return this._locationY;
        }

        this._locationY = this.settings.height / 2 - this.radius;
        return this._locationY;
    }

    private get radius(): number {
        if (this._radius) {
            return this._radius;
        }
        this._radius = Math.min(this.settings.width, this.settings.height) / 2;
        return this._radius;
    }

    private get showTextValueInsteadOfNumber(): boolean {
        return this.settings.setStringTextValueWhenValueIsUknown && !this.initialValueIsValidNumber;
    }

    private get textPixels(): number {
        if (this._textPixels) {
            return this._textPixels;
        }
        this._textPixels = (this.settings.textSize * this.radius / 2);
        return this._textPixels;
    }

    private get waveClipCount(): number {
        return 1 + this.settings.waveCount;
    }

    private get waveClipWidth() {
        if (this._waveClipWidth) {
            return this._waveClipWidth;
        }
        this._waveClipWidth = this.waveLength * this.waveClipCount;
        return this._waveClipWidth;
    }

    private get waveGroupXPosition(): number {
        if (this._waveGroupXPosition) {
            return this._waveGroupXPosition;
        }
        this._waveGroupXPosition = this.fillCircleMargin + this.fillCircleRadius * 2 - this.waveClipWidth;
        return this._waveGroupXPosition;
    }

    private get waveHeight(): number {
        if (this._waveHeight) {
            return this._waveHeight;
        }

        this._waveHeight = this.fillCircleRadius * this.waveHeightScale(this.fillPercent * 100);
        return this._waveHeight;
    }


    private get waveId(): string {
        return 'clipWave' + this.wrapper.id;
    }

    private get waveLength(): number {
        if (this._waveLength) {
            return this._waveLength;
        }

        this._waveLength = this.fillCircleRadius * 2 / this.settings.waveCount;
        return this._waveLength;
    }

    private _circleFillGap?: number;

    private _circleThickness?: number;

    private _data?: any[];

    private _fillCircleMargin?: number;

    private _fillCircleRadius?: number;

    private _fillPercent?: number;

    private _locationX?: number;

    private _locationY?: number;

    private _radius?: number;

    private _textPixels?: number;
    private _waveClipWidth?: number;

    private _waveGroupXPosition?: number;

    private _waveHeight?: number;

    private _waveLength?: number;
    private clipArea: d3.Area<[number, number]>;
    private gaugeCircleArc: d3.Arc<any, d3.DefaultArcObject>;
    private gaugeCircleX: d3.ScaleLinear<number, number>;
    private gaugeCircleY: d3.ScaleLinear<number, number>;
    private gEnter: d3.Selection<d3.BaseType, any, Element, {}>;

    private initialValue: number = 0;

    private initialValueIsValidNumber: boolean = true;

    private startValue: number = 0;
    private svgEnter: d3.Selection<d3.BaseType, any, Element, {}>;
    private svgMerge;
    private textRiseScaleY: d3.ScaleLinear<number, number>;
    private waveAnimateScale: d3.ScaleLinear<number, number>;

    private waveHeightScale: d3.ScaleLinear<number, number>;
    private waveRiseScale: d3.ScaleLinear<number, number>;
    private waveScaleX: d3.ScaleLinear<number, number>;
    private waveScaleY: d3.ScaleLinear<number, number>;
    private waveValue: number = 0;

    constructor(private readonly wrapper: Element, private settings: LiquidFillGaugeSettings = new LiquidFillGaugeSettings()) {

        this.instantiateSvg();
    }

    start(initialValue: number, waveValue?: number): void {

        if (this.settings.distinctWaveFromGaugeValue && (waveValue === null || waveValue === undefined)) {
            throw new Error('When distinctWaveFromGaugeValue is turned on waveValue cannot be empty.');
        }
        this.waveValue = waveValue;

        if (this.isValueIsValidNumber(initialValue)) {
            this.initialValueIsValidNumber = true;
            this.initialValue = initialValue;
        } else {
            this.initialValueIsValidNumber = false;
            this.initialValue = this.temporaryValueInseadOfProvidedValue();
        }

        d3Select(this.wrapper).selectAll('svg').data([this.initialValue]);

        this.createFunctions();

        this.fillGauge();
        this.animateWave();
    }

    update(value: number, waveValue: number, settings?: LiquidFillGaugeSettings): void {
        if (settings) {
            this.settings = settings;
        }

        this.startValue = this.initialValue;
        this.waveValue = waveValue;
        if (this.isValueIsValidNumber(value)) {
            this.initialValue = value;
            this.initialValueIsValidNumber = true;
        } else {
            this.initialValueIsValidNumber = false;
            this.initialValue = this.temporaryValueInseadOfProvidedValue();
        }

        d3Select(this.wrapper).selectAll('svg').data([this.initialValue]);

        this._circleFillGap = undefined;
        this._circleThickness = undefined;
        this._data = undefined;
        this._fillCircleMargin = undefined;
        this._fillCircleRadius = undefined;
        this._fillPercent = undefined;
        this._locationX = undefined;
        this._locationY = undefined;
        this._radius = undefined;
        this._textPixels = undefined;
        this._waveClipWidth = undefined;
        this._waveGroupXPosition = undefined;
        this._waveHeight = undefined;
        this._waveLength = undefined;

        this.svgEnter.attr('width', this.settings.width);
        this.svgEnter.attr('height', this.settings.height);

        this.createFunctions();

        this.svgEnter.attr('width', this.settings.width);
        this.svgEnter.attr('height', this.settings.height);

        let waveGroup = this.gEnter.select(`#${ this.waveId }`);
        let wave = waveGroup.select(`path`);

        this.findOrCreate(this.gEnter, 'path', true)
            .attr('d', this.gaugeCircleArc)
            .attr('transform', 'translate(' + this.radius + ',' + this.radius + ')');

        let ggEnter = this.findOrCreate(this.gEnter, 'g', true);
        let ggEnterCircle = this.findOrCreate(ggEnter, 'circle', true);
        ggEnterCircle
        .attr('cx', this.radius)
        .attr('cy', this.radius)
        .attr('r', this.fillCircleRadius)
        .style('fill', this.settings.waveColor);

        wave.transition()
            .duration(0)
            .transition()
            .duration(this.settings.waveRiseTime)
            .ease(d3EaseLinear)
            .attr('d', this.clipArea(this.data))
            .attr('transform', 'translate(' + this.waveAnimateScale(1) + ',0)')
            .attr('T', '1')
            .on('end', () => {
                wave.attr('transform', 'translate(' + this.waveAnimateScale(0) + ',0)');
                this.animateWave();
            });

        waveGroup.transition()
                 .duration(this.settings.waveRiseTime)
                 .attr('transform', 'translate(' + this.waveGroupXPosition + ',' + this.waveRiseScale(this.fillPercent) + ')');

        this.updateText();

        this.findOrCreate(this.gEnter, 'path', true)
            .style('fill', this.settings.circleColor);
    }

    private animateWave() {

        if (!this.wrapper) {
            return;
        }
        let wave = this.svgMerge.select('.wave-clip-path');
        let T = parseInt(wave.attr('T'));
        wave.attr('transform', 'translate(' + this.waveAnimateScale(T) + ',0)');
        wave.transition()
            .duration(this.settings.waveAnimateTime * (1 - T))
            .ease(d3EaseLinear)
            .attr('transform', 'translate(' + this.waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .on('end', () => {
                wave.attr('T', 0);
                this.animateWave();
            });
    }

    private createFunctions(): void {
        this.waveHeightScale = d3ScaleLinear()
        .range([0, this.settings.waveHeight, 0])
        .domain([this.settings.minValue, this.settings.minValue + (this.settings.maxValue - this.settings.minValue) / 2, this.settings.maxValue]);

        this.waveAnimateScale = d3ScaleLinear()
        .range([0, this.waveClipWidth - this.fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
        .domain([0, 1]);
        this.gaugeCircleX = d3ScaleLinear().range([0, 2 * Math.PI]).domain([0, 1]);
        this.gaugeCircleY = d3ScaleLinear().range([0, this.radius]).domain([0, this.radius]);
        this.waveScaleX = d3ScaleLinear().range([0, this.waveClipWidth]).domain([0, 1]);
        this.waveScaleY = d3ScaleLinear().range([0, this.waveHeight]).domain([0, 1]);
        this.waveRiseScale = d3ScaleLinear()
        .range([(this.fillCircleMargin + this.fillCircleRadius * 2 + this.waveHeight), (this.fillCircleMargin - this.waveHeight)])
        .domain([0, 1]);
        //range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])

        this.textRiseScaleY = d3ScaleLinear()
        .range([this.fillCircleMargin + this.fillCircleRadius * 2, (this.fillCircleMargin + this.textPixels * 0.7)])
        .domain([0, 1]);

        // Draw the outer circle.
        this.gaugeCircleArc = d3Arc()
        .startAngle(this.gaugeCircleX(0))
        .endAngle(this.gaugeCircleX(1))
        .outerRadius(this.gaugeCircleY(this.radius))
        .innerRadius(this.gaugeCircleY(this.radius - this.circleThickness));

        // The clipping wave area.
        this.clipArea = d3Area()
        .x((d) => {

            return this.waveScaleX((d as any).x);
        })
        .y0((d) => {
            return this.waveScaleY(Math.sin(Math.PI * 2 * this.settings.waveOffset * -1 +
                Math.PI * 2 * (1 - this.settings.waveCount) + (d as any).y * 2 * Math.PI));
        })
        .y1(() => this.fillCircleRadius * 2 + this.waveHeight);
    }

    private fillGauge(update: boolean = false): void {

        if (!update) {
            this.gEnter = this.svgEnter.append('g');
        }

        let textValue: string = this.startValue + this.settings.textSuffix;

        this.gEnter.attr('transform', 'translate(' + this.locationX + ',' + this.locationY + ')')
            .attr('class', 'liquid-gauge');

        this.findOrCreate(this.gEnter, 'path', update)
            .attr('class', 'liquidGaugeCircle')
            .attr('d', this.gaugeCircleArc)
            .style('fill', this.settings.circleColor)
            .attr('transform', 'translate(' + this.radius + ',' + this.radius + ')');

        // Text above the wave
        this.findOrCreate(this.gEnter, 'text', update)
            .attr('class', 'above-wave-text')
            .attr('text-anchor', 'middle')
            .attr('font-size', this.textPixels + 'px')
            .style('fill', this.settings.waveTextColor)
            .text(textValue);

        let waveGroupEnter = this.findOrCreate(this.gEnter, 'defs', update);
        let waveGroupEnterClipPath = this.findOrCreate(waveGroupEnter, 'clipPath', update);
        waveGroupEnterClipPath
        .attr('id', this.waveId)
        .attr('transform', 'translate(' + this.waveGroupXPosition + ',' + this.waveRiseScale(this.startValue) + ')');

        this.findOrCreate(waveGroupEnterClipPath, 'path', update)
            .attr('class', 'wave-clip-path')
            .attr('d', this.clipArea(this.data))
            .attr('T', update ? 1 : 0);

        this.svgMerge.select('clipPath')
            .transition()
            .duration(this.settings.waveRiseTime)
            .attr('transform', 'translate(' + this.waveGroupXPosition + ',' + this.waveRiseScale(this.fillPercent) + ')');

        // The inner circle with the clipping wave attached.
        let gCircle = this.findOrCreate(this.gEnter, 'g', update);
        gCircle.attr('clip-path', `url(#${ this.waveId })`);
        let ggEnterCircle = this.findOrCreate(gCircle, 'circle', update);
        ggEnterCircle
        .attr('cx', this.radius)
        .attr('cy', this.radius)
        .attr('r', this.fillCircleRadius)
        .style('fill', this.settings.waveColor);

        this.findOrCreate(gCircle, 'text', update)
            .attr('class', 'below-wave-text')
            .attr('text-anchor', 'middle')
            .attr('font-size', this.textPixels + 'px')
            .style('fill', this.settings.textColor)
            .text(textValue);

        // Text above the wave
        this.updateText();
    }

    private findOrCreate(findIn: d3.Selection<d3.BaseType, any, Element, {}>,
                         name: string, update: boolean): d3.Selection<d3.BaseType, any, Element, {}> {
        let el: d3.Selection<d3.BaseType, any, Element, {}>;
        if (!update) {
            el = findIn.append(name);
        } else {
            el = findIn.select(name);
        }
        return el;
    }

    private instantiateSvg(): void {
        let svgData = d3Select(this.wrapper).selectAll('svg').data([this.initialValue]);
        this.svgEnter = svgData.enter().append('svg'); // append only on enter
        this.svgEnter.attr('width', this.settings.width);
        this.svgEnter.attr('height', this.settings.height);

        this.svgMerge = svgData.merge(this.svgEnter);
    }

    private isValueIsValidNumber(val: number): boolean {
        if (!val && val !== 0) {
            return false;
        }

        try {
            Number.parseInt(val.toFixed());
            return true;
        } catch {
            return false;
        }
    }

    private temporaryValueInseadOfProvidedValue(): number {
        let value: number = 0;
        if (this.settings.maxValue && this.settings.maxValue !== 0) {
            value = this.settings.maxValue / 2;
        } else {
            value = 3;
        }
        return value;
    }

    private textRounder(value: any) {
        return String(parseFloat(value).toFixed(2));
    }

    private updateText(): void {

        let showTextValueInsteadOfNumber: boolean = this.showTextValueInsteadOfNumber;
        let textValue: string = this.startValue + this.settings.textSuffix;

        this.svgMerge.select('.above-wave-text').style('fill', this.settings.textColor);
        this.svgMerge.select('.below-wave-text').style('fill', this.settings.waveTextColor);

        let aboveWaveTextSelect = this.svgMerge.select('.above-wave-text')
                                      .attr('font-size', this.textPixels + 'px')
                                      .text(textValue)
                                      .attr('transform', 'translate(' + this.radius + ',' + this.textRiseScaleY(this.settings.textVertPosition) + ')')
                                      .transition()
                                      .duration(this.settings.waveRiseTime);

        if (!showTextValueInsteadOfNumber) {
            aboveWaveTextSelect.on('start', (d, i, group) => {
                let element = group[i] as SVGTextElement;
                d3Active(element).tween('text', () => {
                    let textI = d3Interpolate(element.textContent, this.textRounder(d));
                    return (t) => {
                        let roundedWithContext = this.textRounder(textI(t));
                        element.textContent = roundedWithContext + this.settings.textSuffix;
                    };
                });
            });
        } else {
            aboveWaveTextSelect
            .on('start', (d, i, group) => {
                let element = group[i] as SVGTextElement;
                element.textContent = '?';
                d;
            });
        }

        let belowWaveTextSelect = this.svgMerge
                                      .select('.below-wave-text')
                                      .text(textValue)
                                      .attr('font-size', this.textPixels + 'px')
                                      .attr('transform', 'translate(' + this.radius + ',' + this.textRiseScaleY(this.settings.textVertPosition) + ')')
                                      .transition()
                                      .duration(this.settings.waveRiseTime);
        if (!showTextValueInsteadOfNumber) {
            belowWaveTextSelect
            .on('start', (d, i, group) => {
                let element = group[i] as SVGTextElement;
                d3Active(element).tween('text', () => {
                    let textI = d3Interpolate(element.textContent, this.textRounder(d));
                    return (t) => {
                        let roundedWithContext = this.textRounder(textI(t));
                        element.textContent = roundedWithContext + this.settings.textSuffix;
                    };
                });
            });
        } else {
            belowWaveTextSelect
            .on('start', (d, i, group) => {
                let element = group[i] as SVGTextElement;
                element.textContent = '?';
                d;
            });
        }

        return;

    }
}
