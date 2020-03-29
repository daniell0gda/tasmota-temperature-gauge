export class AppSettings {
  key:string =  'sonoff-th10-prefix';

  get urlValue(): string {
    return localStorage.getItem(`${this.key}-url`);
  }

  set urlValue(value: string) {
    localStorage.setItem(`${this.key}-url`, value);
  }

  get minTemp(): number | undefined {
    const minTemp = localStorage.getItem(`${this.key}-minTemp`);
    if (minTemp) {
      return parseInt(minTemp);
    }
    return;
  }

  set minTemp(value: number | undefined) {
    localStorage.setItem(`${this.key}-minTemp`, `${value}`);
  }

  get maxTemp(): number | undefined {
    const minTemp = localStorage.getItem(`${this.key}-maxTemp`);
    if (minTemp) {
      return parseInt(minTemp);
    }
    return;
  }

  set maxTemp(value: number | undefined) {
    localStorage.setItem(`${this.key}-maxTemp`, `${value}`);
  }
}
