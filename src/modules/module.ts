export class LineChartData {
    visible: boolean = false;

    withRefreshRate: number = 1;

    constructor(public date: Date, public temp: number) {

    }
}

export interface IMargin {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
