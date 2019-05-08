# Arduino IDE PoC

[![Build Status](https://dev.azure.com/typefox/Arduino/_apis/build/status/bcmi-labs.arduino-editor?branchName=master)](https://dev.azure.com/typefox/Arduino/_build/latest?definitionId=4&branchName=master)

> **Beware:** This is very much work-in-progress. Things can and probably will be broken, even on master.

This repo contains a proof-of-concept for an Arduino IDE based on Theia.
It's built on top of a [fork of the arduino-cli](https://github.com/typefox/arduino-cli/tree/daemon) that sports a gRPC interface.

## How to try (offline)

```
git clone https://github.com/bcmi-labs/arduino-editor
cd arduino-poc
yarn
yarn --cwd arduino-ide-electron start
```

## Arduino-PoC Electron Application
 - The project is built on [Azure DevOps](https://dev.azure.com/typefox/Arduino).
 - The configured pipelines are available [here](https://dev.azure.com/typefox/Arduino/_build?definitionId=4).
 - Currently, we build for Windows, macOS, and Linux. If you want to download the Arduino-PoC Electron application, follow the steps from below.
 ![](static/download_01.gif)
 ![](static/download_02.gif)
 - Click [here](./electron/README.md) more details on the CI/CD, the GitHub release, and the build process in general.