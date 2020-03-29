import * as d3 from 'd3';


export class TimeFormat {
    formatDay: (date: Date) => string = d3.timeFormat('%a %d');
    formatHour: (date: Date) => string = d3.timeFormat('%I %p');
    //https://github.com/d3/d3-time-format#locale_format
    formatMillisecond: (date: Date) => string = d3.timeFormat('.%L');
    formatMinute: (date: Date) => string = d3.timeFormat('%I:%M');
    formatMonth: (date: Date) => string = d3.timeFormat('%B');
    formatSecond: (date: Date) => string = d3.timeFormat(':%S');
    formatWeek: (date: Date) => string = d3.timeFormat('%b %d');
    formatYear: (date: Date) => string = d3.timeFormat('%Y');


    multiFormat(date: Date): string {
        return (d3.timeSecond(date) < date ? this.formatMillisecond
            : d3.timeMinute(date) < date ? this.formatSecond
                : d3.timeHour(date) < date ? this.formatMinute
                    : d3.timeDay(date) < date ? this.formatHour
                        : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? this.formatDay : this.formatWeek)
                            : d3.timeYear(date) < date ? this.formatMonth
                                : this.formatYear)(date);
    }
}
