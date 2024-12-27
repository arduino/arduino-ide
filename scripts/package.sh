#!/bin/bash -i

set -e

yarn install --immutable \
&& yarn --cwd arduino-ide-extension build \
&& yarn test \
&& yarn --cwd arduino-ide-extension test:slow \
&& yarn --cwd arduino-ide-extension lint \
&& yarn --cwd electron-app rebuild \
&& yarn --cwd electron-app build \
&& yarn --cwd electron-app package
