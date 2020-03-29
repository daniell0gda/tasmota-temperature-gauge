import {MSICreator} from 'electron-wix-msi';
import * as path from 'path';

export default class CreateInstaller {
  static msiCreator: MSICreator;

  constructor() {

  }

  static async createAndCompile(): Promise<void> {
    const packagePath = path.join(__dirname, '..','..', 'tray-sonoff-temp-package', 'tempReader-win32-x64');
    this.msiCreator = new MSICreator({
      appDirectory: packagePath,
      description: 'Sonoff Wifi Temp sensor',
      exe: 'tempReader',
      name: 'TempSensor',
      manufacturer: 'ferdelyszys',
      version: '0.9.1',
      outputDirectory: packagePath
    });

    await this.msiCreator.create();
    await this.msiCreator.compile();
  }
}
CreateInstaller.createAndCompile();

