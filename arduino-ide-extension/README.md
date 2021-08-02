## Arduino IDE Extension

Arduino IDE is based on Theia, and most of its IDE features, UIs and customizations are implemented in this Theia extension.

### IDE Services

IDE services typically have a backend part in [src/node/](./src/node/) and a front-end part in [src/browser/](./src/browser/).

#### Boards Service

The Boards Service continuously checks the computer's ports, in order to detect when you connect or disconnect an Arduino board.

The Boards Manager lists all the known board types, and allows downloading new cores to get additional board types.

- [src/common/protocol/boards-service.ts](./src/common/protocol/boards-service.ts) implements the common classes and interfaces
- [src/node/boards-service-impl.ts](./src/node/boards-service-impl.ts) implements the service backend:
  - discovering ports & boards
  - searching for compatible board types
  - installing new board types
- [src/browser/boards/boards-list-widget.ts](./src/browser/boards/boards-service-client-impl.ts) implements the Boards Manager front-end:
  - browsing/searching available board types
  - installing new board types

#### Core Service

The Core Service is responsible for building your sketches and uploading them to a board.

- [src/common/protocol/core-service.ts](./src/common/protocol/core-service.ts) implements the common classes and interfaces
- [src/node/core-service-impl.ts](./src/node/core-service-impl.ts) implements the service backend:
  - compiling a sketch for a selected board type
  - uploading a sketch to a connected board

#### Monitor Service

The Monitor Service allows getting information back from sketches running on your Arduino boards.

- [src/common/protocol/monitor-service.ts](./src/common/protocol/monitor-service.ts) implements the common classes and interfaces
- [src/node/monitor-service-impl.ts](./src/node/monitor-service-impl.ts) implements the service backend:
  - connecting to / disconnecting from a board
  - receiving and sending data
- [src/browser/monitor/monitor-widget.tsx](./src/browser/monitor/monitor-widget.tsx) implements the serial monitor front-end:
  - viewing the output from a connected board
  - entering data to send to the board

#### Config Service

The Config Service knows about your system, like for example the default sketch locations.

- [src/common/protocol/config-service.ts](./src/common/protocol/config-service.ts) implements the common classes and interfaces
- [src/node/config-service-impl.ts](./src/node/config-service-impl.ts) implements the service backend:
  - getting the `arduino-cli` version and configuration
  - checking whether a file is in a data or sketch directory

### `"arduino"` configuration in the `package.json`:
 - `"cli"`:
   - `"version"` type `string` | `{ owner: string, repo: string, commitish?: string }`: if the type is a `string` and is a valid semver, it will get the corresponding [released](https://github.com/arduino/arduino-cli/releases) CLI. If the type is `string` and is a [date in `YYYYMMDD`](https://arduino.github.io/arduino-cli/latest/installation/#nightly-builds) format, it will get a nightly CLI. If the type is an object, a CLI, build from the sources in the `owner/repo` will be used. If `commitish` is not defined, the HEAD of the default branch will be used. In any other cases an error is thrown.

#### Rebuild gRPC protocol interfaces
  - Some CLI updates can bring changes to the gRPC interfaces, as the API might change. gRPC interfaces can be updated running the command
    `yarn --cwd arduino-ide-extension generate-protocol`

### Customize Icons
ArduinoIde uses a customized version of FontAwesome.
In order to update/replace icons follow the following steps:
  - import the file `arduino-icons.json` in [Icomoon](https://icomoon.io/app/#/projects)
  - load it
  - edit the icons as needed
  - !! download the **new** `arduino-icons.json` file and put it in this repo
  - Click on "Generate Font" in Icomoon, then download
  - place the updated fonts in the `src/style/fonts` directory
