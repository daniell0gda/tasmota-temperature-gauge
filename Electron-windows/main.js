"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var electron_1 = require("electron");
var fs_1 = require("fs");
var isDev = process.execPath.includes('node_modules/electron/dist/electron');
console.log(process.execPath);
var path = require('path');
var packageJSON = JSON.parse(fs_1.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
var serve = require('electron-serve');
var loadURL = serve({ directory: path.join(__dirname, '..', 'www'), scheme: 'stencil-electron' });
if (isDev) {
    require('electron-reload')(path.join(__dirname, '..', 'www'), {
        electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        hardResetMethod: 'exit'
    });
}
// https://medium.com/@davembush/typescript-and-electron-the-right-way-141c2e15e4e1
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.main = function (app, browserWindow) {
        // https://github.com/SimulatedGREG/electron-vue/issues/424 ??
        var appData = app.getPath('appData');
        app.setPath('userData', path.join(appData, packageJSON.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase().replace(/_{2,}/g, '_')));
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
        if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
            app.quit();
        }
    };
    Main.onWindowAllClosed = function () {
        if (process.platform !== 'darwin') {
            Main.application.quit();
        }
    };
    Main.onClose = function (event) {
        // Dereference the window object.
        //Main.mainWindow = null;
        if (!this.isQuiting) {
            event.preventDefault();
            Main.mainWindow.hide();
        }
        return false;
    };
    Main.onReady = function () {
        return __awaiter(this, void 0, void 0, function () {
            var iconPath, appIcon, contextMenu;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        iconPath = path.join(__dirname, '..', 'www', 'assets', 'icon', 'thermometer.ico');
                        appIcon = new electron_1.Tray(iconPath);
                        Main.mainWindow = new Main.BrowserWindow({
                            icon: iconPath,
                            webPreferences: {
                                nodeIntegration: false
                            },
                            width: 250,
                            height: 320,
                            skipTaskbar: false,
                            frame: true,
                            resizable: true,
                            autoHideMenuBar: true,
                            alwaysOnTop: true,
                            show: true
                        });
                        contextMenu = electron_1.Menu.buildFromTemplate([
                            { label: 'Pokaż Termometr', click: function () {
                                    Main.mainWindow.show();
                                } },
                            { label: 'Zamknij Apkę', click: function () {
                                    Main.isQuiting = true;
                                    Main.mainWindow.destroy();
                                    Main.mainWindow = null;
                                } }
                        ]);
                        // Call this again for Linux because we modified the context menu
                        appIcon.setContextMenu(contextMenu);
                        return [4 /*yield*/, loadURL(Main.mainWindow)];
                    case 1:
                        _a.sent();
                        if (isDev) {
                            Main.mainWindow.webContents.openDevTools();
                        }
                        Main.mainWindow.on('close', Main.onClose);
                        Main.mainWindow.on('minimize', function (event) {
                            event.preventDefault();
                            Main.mainWindow.hide();
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.isQuiting = false;
    return Main;
}());
exports.Main = Main;
