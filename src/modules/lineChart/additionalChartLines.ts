import { LineChartData } from '../module';


export class AdditionalChartLines {
    constructor(public label: string, public value: number) {

    }
}

export class AdditionalChartLinesNested {
    constructor(public y: AdditionalChartLines, public x: LineChartData) {

    }
}
