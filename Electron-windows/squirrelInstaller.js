const electronInstaller = require('electron-winstaller');
const path = require("path");

const install = async ()=>{
  try {

    await electronInstaller.createWindowsInstaller({
      appDirectory:  "../",
      outputDirectory: 'squirrelInstaller',
      authors: 'ferdelyszys',
      iconUrl: path.join(__dirname, '..', 'www', 'assets', 'icon', 'thermometer.ico'),
      setupIcon: path.join(__dirname, '..', 'www', 'assets', 'icon', 'thermometer.ico'),
      setupMsi: 'Sonoff Th10 Tasmota Temp Reader',
      loadingGif: 'installing.gif',
      exe: 'TempSensor.exe',
      version: '1.0.0'
    });
    console.log('It worked!');
  } catch (e) {
    console.log(`No dice: ${e.message}`);
  }

};
install();
