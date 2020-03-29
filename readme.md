# Sonoff Th10 Tasmota Temp Reader in Ionic Stencil PWA Application

I am beer maker, and I am using sonoff all the time just for this purpose. In some steps before beer is ready I am using sonoff to keep an eye on my temperature. 

I was annoying for me to open web page, I wanted to have it always on top.

So this is my simple attempt to achieve that.

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
- Generally Electron/main.ts is quite a thing, Many thanks to [adamlacombe](https://github.com/edgeworkscreative/stencil-electron-app-starter/commits?author=adamlacombe) 
with his [starter](https://github.com/edgeworkscreative/stencil-electron-app-starter) 
- Notice `src/global/globalScript.ts` which is workaround not working ionic icons
- in `package.json` main script `"main": "Electron/app.js"` is for `electron-packager` 
this should be changed to `"main": "build/app.js"` if you want to run pure stencil
