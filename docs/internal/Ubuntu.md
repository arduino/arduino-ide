### Building and start the app from the sources on Ubuntu Linux

Tested and verified on Ubuntu 18.04.4. The source will be checked out to `~/dev/git/arduino-editor`.

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
&& wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
&& source ~/.bashrc \
&& nvm install 12.14.1 \
&& nvm use 12.14.1 \
&& nvm alias default 12.14.1 \
&& curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - \
&& echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list \
&& sudo apt update && sudo apt install --no-install-recommends yarn \
&& mkdir -p ~/dev/git/ \
&& rm -rf ~/dev/git/arduino-editor \
&& git clone --depth 1 https://github.com/bcmi-labs/arduino-editor.git ~/dev/git/arduino-editor \
&& yarn --cwd ~/dev/git/arduino-editor \
&& yarn --cwd ~/dev/git/arduino-editor rebuild:electron \
&& yarn --cwd ~/dev/git/arduino-editor/electron-app start
```
