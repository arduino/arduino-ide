## Electron

All-in-one packager producing the `Arduino IDE` Electron-based application.

## Prerequisites

The prerequisites are defined [here](https://github.com/theia-ide/theia/blob/master/doc/Developing.md#prerequisites).

## Build
To build the Arduino IDE application you have to do the followings:
```bash
yarn --cwd ./electron/packager/ && yarn --cwd ./electron/packager/ package
```

The packaged application will be under the `./electron/build/dist` folder.
