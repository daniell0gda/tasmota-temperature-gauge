export interface ISensorValue {
  Temperature: number;
}
export interface ISensorResponseStatus {
  DS18B20: ISensorValue;
  Time: string;
}
export interface ISensorResponse {
  StatusSNS: ISensorResponseStatus;
  TempUnit: string;
}
