# Arduino IDE PoC

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