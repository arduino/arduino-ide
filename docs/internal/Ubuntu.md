### Building and start the app from the sources on Ubuntu Linux

Tested and verified on Ubuntu 18.04.4. The source will be checked out to `~/dev/git/arduino-ide`.

```
#!/bin/bash -i

sudo apt update \
&& sudo apt install --no-install-recommends --yes \
  git \
  gcc \
  curl \
  make \
  python \
  pkg-config \
  libx11-dev \
  libxkbfile-dev \
  build-essential \
  libsecret-1-dev \
&& wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
&& source ~/.bashrc \
&& nvm install 16 \
&& nvm use 16 \
&& nvm alias default 16 \
&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
&& sudo apt update && sudo apt install --no-install-recommends yarn \
&& mkdir -p ~/dev/git/ \
&& rm -rf ~/dev/git/arduino-ide \
&& git clone --depth 1 https://github.com/arduino/arduino-ide.git ~/dev/git/arduino-ide \
&& yarn --cwd ~/dev/git/arduino-ide \
&& yarn --cwd ~/dev/git/arduino-ide rebuild:electron \
&& yarn --cwd ~/dev/git/arduino-ide/electron-app start
```
