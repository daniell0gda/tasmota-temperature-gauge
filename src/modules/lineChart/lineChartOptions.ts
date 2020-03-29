import { AdditionalChartLines } from './additionalChartLines';


export class LineChartOptions {

    additionalLines: AdditionalChartLines[] = [];
    axisLabelClassName: string = 'axis-label';
    chartLineClassName: string = 'line';
    height: number = 600;

    /**
     * Refresh rate in seconds
     */
    refreshRate: number = 2;
    width: number = 600;
    xLabel: string = 'Godzina';
    yLabel: string = '°C';
}
