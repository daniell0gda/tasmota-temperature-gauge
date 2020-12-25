import {StorageService} from './storageService';

export class SensorStorage extends StorageService{
  constructor(key:string = 'sonoff-th10-temp-logs') {
    super(key);
  }

}
