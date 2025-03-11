import {ReplaySubject} from 'rxjs';

export class GlobalConsole {

  logInfo$ = new ReplaySubject<string>();
  logError$ = new ReplaySubject<string>();


  info(str: string): void {
    this.logInfo$.next(str);
  }

  error(str: string): void {
    this.logError$.next(str);
  }
}
