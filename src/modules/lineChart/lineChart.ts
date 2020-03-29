import * as d3 from 'd3';
import { BaseType } from 'd3';
import filter from 'lodash/filter';
import intersectionBy from 'lodash/intersectionBy';
import meanBy from 'lodash/meanBy';
import range from 'lodash/range';
import slice from 'lodash/slice';
import { Subject } from 'rxjs';

import { IMargin, LineChartData } from '../module';

import { AdditionalChartLines, AdditionalChartLinesNested } from './additionalChartLines';
import { LineChartOptions } from './lineChartOptions';


let {
    select: d3Select
} = d3;

export class LineChart {

    margin: IMargin = {
        left: 40,
        right: 40,
        top: 20,
        bottom: 100
    };
    maxPageReached$: Subject<boolean> = new Subject<boolean>();
    canChangePages$: Subject<boolean> = new Subject<boolean>();
    padding: number = 10;
    previewModePageSize: number = 60;
    visualisationStopped: boolean = false;


    private addLinesG: d3.Selection<BaseType, {}, HTMLElement, any>;
    private currentPage: number = -1;
    private readonly elementsPerPage: number = 30;
    private g: d3.Selection<BaseType, {}, HTMLElement, any>;
    private readonly lineData: LineChartData[] = [];
    private lineDataNested: AdditionalChartLinesNested[][] = [];
    private meanGradient: number = 1;
    private smoothData: LineChartData[] = [];
    private pageEndIndex: number = 0;
    private pageStartIndex: number = 0;
    private svg: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private readonly xScale: d3.ScaleTime<number, number> = d3.scaleTime();
    private xAxis = d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%H:%M:%S')).ticks(3).tickPadding(15);
    private xAxisG: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private readonly xScaleAdditional: d3.ScaleTime<number, number> = d3.scaleTime();
    // private transition: d3.Transition<HTMLElement, {}, null, undefined> = d3.transition()
    //     .duration(750)
    //     .ease(d3.easeLinear);
    private readonly yScale: d3.ScaleLinear<number, number> = d3.scaleLinear();
    private readonly yAxis = d3.axisLeft(this.yScale).ticks(5);
    private yAxisG: d3.Selection<d3.BaseType, {}, HTMLElement, any>;
    private yMaxValue: number = 100;
    private yMinValue: number = 0;

    constructor(public parentElement: HTMLElement, public chartOptions: LineChartOptions = new LineChartOptions()) {

    }

    get canUpdateVisualisation(): boolean {
        return this.currentPage === -1;
    }

    get innerHeight(): number {
        return this.chartOptions.height - this.margin.top - this.margin.bottom;
    }

    get innerWidth(): number {
        return this.chartOptions.width - this.margin.left - this.margin.right;
    }

    get maxPageReached(): boolean {
        return this.currentPage === -1;
    }

    get minPageReached(): boolean {
        return this.currentPage === 0;
    }

    private get pagedData(): LineChartData[] {
        this.calculateSmoothData(this.meanGradient);

        let maxNumberOfPages = Math.ceil(this.smoothData.length / this.elementsPerPage);
        this.canChangePages$.next(maxNumberOfPages > 1);

        this.calculateItemsPerPageIndexes();
        return slice(this.smoothData, this.pageStartIndex, this.pageEndIndex);
    }

    addDataToChart(data?: LineChartData): void {
        if (data) {
            data.withRefreshRate = this.chartOptions.refreshRate;
            this.lineDataAdd(data);
        }
    }

    createChart(data?: LineChartData): void {

        this.addDataToChart(data);

        const xLabel = this.chartOptions.xLabel;

        const yLabel = this.chartOptions.yLabel;

        this.svg = d3Select(this.parentElement).append('svg');
        this.g = this.svg.append('g').attr('name', 'mainG')
                     .attr('width', this.innerWidth)
                     .attr('height', this.innerHeight)
                     .attr('transform', `translate(${ this.margin.left },${ this.margin.top })`);

        this.xAxisG = this.g.append('g');
        this.yAxisG = this.g.append('g');

        this.xAxisG.append('text')
            .attr('class', this.chartOptions.axisLabelClassName + ' xAxisLabel')
            .attr('x', this.innerWidth / 2)
            .attr('y', 40)
            .text(xLabel);

        this.yAxisG.append('text')
            .attr('class', this.chartOptions.axisLabelClassName)
            .attr('x', -this.innerHeight / 2)
            .attr('y', -30)
            .attr('transform', `rotate(-90)`)
            .style('text-anchor', 'middle')
            .text(yLabel);

        this.addLinesG = this.g.append('g').attr('name', 'additionalLines');

        this.updateChart();
    }

    resetChart(): void {
        this.setCurrentPage(-1);

        this.previewModePageSize = this.chartOptions.refreshRate;

        this.updateChart();
    }

    resumeVisualisation(): void {
        this.visualisationStopped = false;
    }

    setGradient(value: number): void {
        this.meanGradient = value;
        this.smoothData = [];
        this.lineData.forEach((d: LineChartData) => d.visible = false);
        this.setCurrentPage(-1);
        this.clearChart();

        this.updateChart();
    }

    showInAScale(pageSizeInSeconds: number = 1, scale: 'second' | 'minute' | 'hour' | 'day'): void {
        this.setCurrentPage(-1);

        let timeFormat: string = '%H:%M:%S';
        if (scale === 'day') {
            timeFormat = '%d-%B-%Y';
            this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.timeFormat(timeFormat)).ticks(pageSizeInSeconds).tickPadding(15);
        } else if (scale === 'hour') {
            timeFormat = '%H';
            this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.timeFormat(timeFormat)).ticks(pageSizeInSeconds).tickPadding(15);
        } else {
            this.xAxis = d3.axisBottom(this.xScale).tickFormat(d3.timeFormat(timeFormat)).ticks(3).tickPadding(15);
        }

        this.previewModePageSize = pageSizeInSeconds;
        this.clearChart();
        this.updateChart();
    }

    showNextPage(): boolean {
        if (this.currentPage === -1) {
            this.setCurrentPage(-1);
            return false;
        }
        let currentPage = this.currentPage + 1;

        this.calculateSmoothData(this.meanGradient);
        let maxNumberOfPages = Math.ceil(this.smoothData.length / this.elementsPerPage);

        if (maxNumberOfPages === currentPage) {
            this.setCurrentPage(-1);
        } else {
            this.setCurrentPage(Math.min(currentPage, maxNumberOfPages));
        }

        this.clearChart();
        this.updateChart();

        return true;
    }

    showLastPage(): void {
        this.currentPage = -1;
        this.updateChart();
        this.clearChart();
    }

    showPreviousPage(): boolean {

        let currPage = -1;
        if (this.currentPage !== -1) {
            currPage -= 1;
        } else {
            this.calculateSmoothData(this.meanGradient);
            currPage = Math.ceil(this.smoothData.length / this.elementsPerPage) - 1;
        }
        currPage = currPage < 0 ? 0 : currPage;

        this.setCurrentPage(currPage);

        this.clearChart();
        this.updateChart();

        return true;
    }

    stopVisualisation(): void {
        this.visualisationStopped = true;
    }

    updateChart(): void {

        this.svg.attr('width', this.chartOptions.width).attr('height', this.chartOptions.height);
        this.svg.select('.xAxisLabel').attr('x', this.innerWidth / 2);

        this.xScale
            .domain(d3.extent(this.pagedData, this.xValue))
            .range([0, this.innerWidth]);

        let minMax = d3.extent(this.pagedData, this.yValue);
        minMax[0] -= 1;
        minMax[1] += 0.5;
        this.yMinValue = minMax[0];
        this.yMaxValue = minMax[1];
        minMax[0] -= 0.5;
        this.yScale
            .domain(minMax)
            .range([this.innerHeight, 0]);

        this.tryPaintLineBoundries();

        this.g.attr('class', 'circles');
        this.g.selectAll('circle').remove();
        const circles = this.g.selectAll('circle').data<LineChartData>(this.pagedData).enter().append('circle');

        circles.attr('fill-opacity', 0.3)
               .attr('class', 'ion-color-light svgIonStrokeColor')
               .attr('r', 2)
               .merge(circles)
               .attr('cx', (d: LineChartData) => this.xScale(this.xValue(d)))
               .attr('cy', (d: LineChartData) => this.yScale(this.yValue(d)));

        this.g.selectAll('.line').remove();
        const path = this.g.selectAll('.line').data([null]).enter().append('path');

        path.attr('class', `${ this.chartOptions.chartLineClassName } ion-color-light svgIonStrokeColor`)
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.5)
            .merge(path)
            .attr('d', this.line(this.pagedData));

        this.xAxisG.attr('transform', `translate(0, ${ this.innerHeight })`)
            .call(this.xAxis.tickSize(-this.innerHeight));

        this.yAxisG.call(this.yAxis.tickSize(-this.innerWidth));
    }

    private setCurrentPage(val: number = -1): void {
        this.currentPage = val;
        this.maxPageReached$.next(this.currentPage === -1);
    }

    /**
     * Taking items from whole dataset and converting it to more/less granular visualisation.
     * @param pageSizeInSeconds how many items will be combined into one
     */
    private calculateSmoothData(pageSizeInSeconds: number = 1): LineChartData[] {

        if (pageSizeInSeconds === 1) {
            this.smoothData = this.lineData;
            return this.lineData;
        }

        let computed: LineChartData[] = [];

        let dataToBeComputed: LineChartData[] = filter(this.lineData, (d) => {
            return !d.visible;
        });

        do {
            if (dataToBeComputed.length === 0) {
                break;
            }
            if (dataToBeComputed.length < pageSizeInSeconds) {
                break;
            }

            let pagedData: LineChartData[] = [];
            let restOfData: LineChartData[] = [];
            for (let index = 0; index < dataToBeComputed.length; index++) {
                const element = dataToBeComputed[index];
                if (index >= pageSizeInSeconds) {
                    restOfData.push(element);
                } else {
                    pagedData.push(element);
                }
            }
            dataToBeComputed = restOfData;

            pagedData.forEach(d => d.visible = true);
            let meanTemp = meanBy(pagedData, (data: LineChartData) => data.temp);
            computed.push(new LineChartData(pagedData[pagedData.length - 1].date, meanTemp));
        }
        while (dataToBeComputed.length > 0);

        computed.forEach(d => {
            this.smoothData.push(d);
        });
        return computed;
    }

    private lineDataAdd(data: LineChartData): void {
        this.lineData.push(data);
    }

    private tryPaintLineBoundries(): void {
        if (!this.yMinValue || !this.yMaxValue) {
            return;
        }

        this.lineDataNested = [];
        let minMax = d3.extent(this.lineData, (d) => d.date);

        let matchedAdditionalLines: AdditionalChartLines[] = intersectionBy(this.chartOptions.additionalLines,
            [...range(this.yMinValue, this.yMaxValue), this.yMaxValue].map(val => new AdditionalChartLines('', val)),
            (line: AdditionalChartLines) => {
                return line.value;
            });

        if (matchedAdditionalLines.length === 0) {
            return;
        }

        if (matchedAdditionalLines.length > 2) {
            matchedAdditionalLines = matchedAdditionalLines.slice(0, 1);
        }

        matchedAdditionalLines.forEach(line => {
            let lineData: AdditionalChartLinesNested[] = [
                new AdditionalChartLinesNested(line, new LineChartData(minMax[0], line.value)),
                new AdditionalChartLinesNested(line, new LineChartData(minMax[1], line.value))
            ];
            this.lineDataNested.push(lineData);
        });
        let boundryLineContainer = this.addLinesG.selectAll('.boundryLineContainer').data(this.lineDataNested);
        boundryLineContainer.enter().append('g').attr('class', 'boundryLineContainer');

        let boundryLineText = boundryLineContainer.selectAll('.boundryLineText').data(d => d).enter().append('text');
        boundryLineText.attr('class', 'boundryLineText')
                       .merge(boundryLineText)
                       .attr('x', this.innerWidth / 2)
                       .attr('y', d => this.yScale(d.y.value))
                       .attr('transform', `translate(0, -6)`)
                       .text(d => d.y.label);

        this.xScaleAdditional.range([0, this.innerWidth]).domain(d3.extent(this.lineDataNested[0], this.xValueAdditional)).nice();

        let lines = boundryLineContainer.selectAll('.boundryLine').data(this.lineDataNested).enter().append('path');
        lines.attr('class', 'boundryLine')
             .attr('stroke', 'black')
             .merge(lines)
             .attr('d', (m: AdditionalChartLinesNested[]) => this.additionalLine(m));
    }

    private calculateItemsPerPageIndexes(data: LineChartData[] = this.smoothData, elementsPerPage: number = this.elementsPerPage): void {
        let lineDataLength: number = data.length;

        if (this.currentPage === -1) {
            this.pageStartIndex = Math.max(lineDataLength - elementsPerPage - 1, 0);
            this.pageEndIndex = lineDataLength;
        } else {
            this.pageStartIndex = Math.max(elementsPerPage * this.currentPage - 1, 0);
            this.pageEndIndex = Math.min(this.pageStartIndex + elementsPerPage, lineDataLength - 1);
        }
    }

    private readonly xValue = (d: LineChartData) => d.date;

    private readonly xValueAdditional = (d: AdditionalChartLinesNested) => d.x.date;

    private readonly additionalLine: d3.Line<AdditionalChartLinesNested> = d3.line<AdditionalChartLinesNested>()
                                                                             .x(d => this.xScaleAdditional(this.xValueAdditional(d)))
                                                                             .y(d => this.yScale(d.y.value));

    private readonly yValue = (d: LineChartData) => d.temp;

    private readonly line = d3.line<LineChartData>()
                              .x((d: LineChartData) => this.xScale(this.xValue(d)))
                              .y((d: LineChartData) => this.yScale(this.yValue(d))).curve(d3.curveMonotoneY);

    private clearChart(): void {
        this.g.selectAll('circle').remove();
        this.g.selectAll('.line').remove();
    }
}
