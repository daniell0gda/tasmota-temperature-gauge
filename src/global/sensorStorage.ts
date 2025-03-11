import {StorageService} from './storageService';
import {GlobalConsole} from './globalConsole';

export class SensorStorage extends StorageService{
  constructor(key:string = 'sonoff-th10-temp-logs', consoleService:GlobalConsole= null) {
    super(key, consoleService);
  }

}
