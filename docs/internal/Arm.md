### Building from the sources on Linux ARM

Building the Pro IDE on Linux `armv7l` (aka `armhf`) and `aarch64` (aka `arm64`):

1. Install Node.js 10.x with [nvm](https://github.com/nvm-sh/nvm#install--update-script):
    ```
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
    ```
    Restart your shell then:
    ```
    nvm install 12.14.1
    nvm use 12.14.1
    ```
    Verify:
    ```
    node -v
    v12.14.1
    ```

2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install/#debian-stable):

    Configure the Debian package repository; otherwise, you will pull a different `yarn`.
    ```
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    ```
    Install:
    ```
    sudo apt update && sudo apt install --no-install-recommends yarn
    ```
    Verify:
    ```
    yarn -v
    1.22.4
    ```

3. Other native [dependencies](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites):
    - `make`,
    - `gcc`,
    - `pkg-config`,
    - `build-essential`,
    - `libx11-dev`, and
    - `libxkbfile-dev`

4. [Build it](https://github.com/bcmi-labs/arduino-editor#build-from-source) from the source:
    ```
    git clone https://github.com/bcmi-labs/arduino-editor.git \
    && cd arduino-editor \
    && yarn \
    && yarn rebuild:electron \
    && yarn --cwd ./electron-app start
    ```

5. Troubleshoot

    If you see [`ENOSPC` errors](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#linux) at runtime, increase the default `inotify` watches:
    ```
    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
    ```
