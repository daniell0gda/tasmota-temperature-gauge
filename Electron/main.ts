import {BrowserWindow, Menu, Tray} from 'electron';
import {readFileSync} from 'fs';
import {PackageJson} from '../src/Types/package-json';

const isDev = process.execPath.includes('node_modules/electron/dist/electron');
const path = require('path');
const packageJSON: PackageJson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const serve = require('electron-serve');
const loadURL = serve({directory: path.join(__dirname, '..', 'www'), scheme: 'stencil-electron'});

if (isDev) {
  require('electron-reload')(path.join(__dirname, '..', 'www'), {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// https://medium.com/@davembush/typescript-and-electron-the-right-way-141c2e15e4e1
export class Main {
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow: typeof BrowserWindow;
  static isQuiting:boolean = false;

  static main(app: Electron.App, browserWindow: typeof BrowserWindow):void {
    // https://github.com/SimulatedGREG/electron-vue/issues/424 ??
    const appData = app.getPath('appData');
    app.setPath('userData', path.join(appData, packageJSON.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase().replace(/_{2,}/g, '_')));

    Main.BrowserWindow = browserWindow;
    Main.application = app;
    Main.application.on('window-all-closed', Main.onWindowAllClosed);
    Main.application.on('ready', Main.onReady);
  }

  private static onWindowAllClosed():void {
    if (process.platform !== 'darwin') {
      Main.application.quit();
    }
  }

  private static onClose(event:Event):boolean {
    // Dereference the window object.
    //Main.mainWindow = null;
    if(!this.isQuiting){
      event.preventDefault();
      Main.mainWindow.hide();
    }

    return false;
  }

  private static async onReady():Promise<void> {
    const iconPath =  path.join(__dirname, '..', 'www', 'assets', 'icon', 'thermometer.ico');

    const appIcon = new Tray(iconPath);

    Main.mainWindow = new Main.BrowserWindow({
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false
      },
      width:250,
      height:320,
      skipTaskbar:false,
      frame:true,
      resizable:true,
      autoHideMenuBar:true,
      alwaysOnTop:true
    });

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Pokaż Termometr', click:  ()=>{
          Main.mainWindow.show();
        } },
      { label: 'Zamknij Apkę', click:  ()=>{
          Main.isQuiting = true;
          Main.mainWindow.destroy();
          Main.mainWindow = null;
        } }
    ]);

    // Call this again for Linux because we modified the context menu
    appIcon.setContextMenu(contextMenu);

    await loadURL(Main.mainWindow);
    if (isDev) {
      Main.mainWindow.webContents.openDevTools();
    }

    Main.mainWindow.on('close', Main.onClose);
    Main.mainWindow.on('minimize',(event:Event)=>{
      event.preventDefault();
      Main.mainWindow.hide();
    });


  }
}
