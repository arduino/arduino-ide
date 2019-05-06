# Arduino IDE PoC

> **Beware:** This is very much work-in-progress. Things can and probably will be broken, even on master.

This repo contains a proof-of-concept for an Arduino IDE based on Theia.
It's built on top of a [version of the arduino-cli](https://github.com/cmaglie/arduino-cli/tree/daemon) that sports a gRPC interface.

## How to try (online)
The easiest way to try the browser version is using Gitpod: https://gitpod.io/#github.com/typefox/arduino-poc

## How to try (offline)
requires [protoc](https://github.com/protocolbuffers/protobuf/releases/tag/v3.7.1) to be in the `PATH` and some other [prerequisites](https://github.com/theia-ide/theia/blob/master/doc/Developing.md#prerequisites).

```
git clone https://github.com/typefox/arduino-poc
cd arduino-poc
yarn
yarn --cwd arduino-ide-electron start
```