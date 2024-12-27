### Building and start the app from the sources on Ubuntu Linux

Tested and verified on Ubuntu 22.04. The source will be checked out to `~/dev/git/arduino-ide`.

> ❗ This is an all-in-one script to create production-ready, minified code; you will need ~16GB of RAM to run it. This script will install libraries you might already have on your system and change the default Node.js version you do not want. If you look for documentation on development, please reference [this](../development.md#prerequisites) section instead.

```
#!/bin/bash -i

sudo apt update \
&& sudo apt install --no-install-recommends --yes \
  git \
  gcc \
  curl \
  make \
  python3 \
  pkg-config \
  libx11-dev \
  libxkbfile-dev \
  build-essential \
  libsecret-1-dev \
&& wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
&& source ~/.bashrc \
&& nvm install 18.17 \
&& nvm use 18.17 \
&& nvm alias default 18.17 \
&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
&& sudo apt update && sudo apt install --no-install-recommends yarn \
&& mkdir -p ~/dev/git/ \
&& rm -rf ~/dev/git/arduino-ide \
&& git clone --depth 1 https://github.com/arduino/arduino-ide.git ~/dev/git/arduino-ide \
&& yarn --cwd ~/dev/git/arduino-ide \
&& yarn --cwd ~/dev/git/arduino-ide/electron-app rebuild \
&& yarn --cwd ~/dev/git/arduino-ide build \
&& yarn --cwd ~/dev/git/arduino-ide start
```
