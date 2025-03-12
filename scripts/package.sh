#!/bin/bash -i

set -e

yarn install --immutable --network-timeout 10000000 \
&& yarn --cwd arduino-ide-extension build \
&& yarn --cwd electron-app rebuild \
&& yarn --cwd electron-app build \
&& yarn --cwd electron-app package
