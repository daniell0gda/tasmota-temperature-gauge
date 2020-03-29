# Sonoff Th10 Tasmota Temp Reader in Ionic Stencil PWA Application

I am beer maker, and I am using sonoff all the time just for this purpose. In some steps before beer is ready I am using sonoff to keep an eye on my temperature. 

It was annoying for me to open web page all the time, I wanted to have it always on top.

So this is my simple attempt to achieve that.
<p align="center"><img src="https://github.com/daniell0gda/tasmota-temperature-gauge/blob/master/.github/thermometerPic.png" alt="thermometer picture"></p>

## Features

- Setting url for Th10 local network
- Setting min & max temperature
- Simple "Console" for errors

## Prerequisites
- [electron-wix-msi](https://github.com/felixrieseberg/electron-wix-msi)
- [install the Wix toolkit v3](http://wixtoolset.org/releases/) (for creating installer)
            
    Add bin to the system PATH, e.g. mine path:
    ```
        C:\Program Files (x86)\WiX Toolset v3.11\bin
    ```

## Getting Started

```bash
npm install
```

to run server locally:

```bash
npm start
```

to create package ready to be passed on to create installer
```bash
npm run-script packager
```

To create msi installer run (package needs to be already created)

```bash
node Electron/createInstaller.js
```

## Gotchas

### For Running Electron with stencilJs
- Notice that electron-serve & electron-store are in package.json dependencies
- Notice Types folder in `src` directory
- Generally Electron/main.ts is quite a thing
- Notice `src/global/globalScript.ts` which is workaround not working ionic icons
- in `package.json` main script `"main": "Electron/app.js"` is for `electron-packager` 
this should be changed to `"main": "build/app.js"` if you want to run pure stencil

### Tasmota
- Go to your local Tasmota home page (of device you are gonna use for this application) and to wifi settings, configure CORS Domain 

## Thanks
- [davidbanks](https://codepen.io/davidbanks) I've reworked his [pen](https://codepen.io/davidbanks/pen/rksLn), added few features
- [adamlacombe](https://github.com/edgeworkscreative/stencil-electron-app-starter/commits?author=adamlacombe) 
  with his [starter](https://github.com/edgeworkscreative/stencil-electron-app-starter)
  
## TODO

- Alert when temperature reaches min or max
- Installer is slow as hell and kinda big (big is maybe not that much fixable because of electron)
