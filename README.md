# Arduino Pro IDE

[![Arduino Pro IDE](https://github.com/bcmi-labs/arduino-editor/workflows/Arduino%20Pro%20IDE/badge.svg)](https://github.com/bcmi-labs/arduino-editor/actions?query=workflow%3A%22Arduino+Pro+IDE%22)

### Download

You can download the latest version of the Arduino Pro IDE application for the supported platforms from the [GitHub release page](https://github.com/arduino/arduino-pro-ide/releases) or following the links in the following table.

#### Latest version

Platform  | 32 bit                   | 64 bit                   |
--------- | ------------------------ | ------------------------ |
Linux     |                          | [Linux 64 bit]           |
Linux ARM | [🚧 Work in progress...] | [🚧 Work in progress...] |
Windows   |                          | [Windows 64 bit]         |
macOS     |                          | [macOS 64 bit]           |

[🚧 Work in progress...]: https://github.com/arduino/arduino-pro-ide/issues/287
[Linux 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_Linux_64bit.zip
[Windows 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_Windows_64bit.zip
[macOS 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_macOS_64bit.dmg

#### Previous versions

These are available from the [GitHub releases page](https://github.com/arduino/arduino-pro-ide/releases).

#### Nightly builds

These builds are generated every day at 03:00 GMT from the `master` branch and
should be considered unstable. In order to get the latest nightly build
available for the supported platform, use the following links:

Platform  | 32 bit                   | 64 bit                   |
--------- | ------------------------ | ------------------------ |
Linux     |                          | [Nightly Linux 64 bit]   |
Linux ARM | [🚧 Work in progress...] | [🚧 Work in progress...] |
Windows   |                          | [Nightly Windows 64 bit] |
macOS     |                          | [Nightly macOS 64 bit]   |

[🚧 Work in progress...]: https://github.com/arduino/arduino-pro-ide/issues/287
[Nightly Linux 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_Linux_64bit.zip
[Nightly Windows 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_Windows_64bit.zip
[Nightly macOS 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_macOS_64bit.dmg

> These links return an HTTP `302: Found` response, redirecting to latest
  generated builds by replacing `latest` with the latest available build
  date, using the format YYYYMMDD (i.e for 2019/Aug/06 `latest` is
  replaced with `20190806` )

### Build from source

If you’re familiar with TypeScript, the [Theia IDE](https://theia-ide.org/), and if you want to contribute to the
project, you should be able to build the Arduino Pro IDE locally. Please refer to the [Theia IDE prerequisites](https://github.com/theia-ide/theia/blob/master/doc/) documentation for the setup instructions.

### Build
```sh
yarn
```

### Rebuild the native dependencies
```sh
yarn rebuild:electron
```
Note: this step takes long. It completes in 4-5 minutes on a MacBook Pro, 2.9 GHz Quad-Core Intel Core i7.

### Start
```sh
yarn start
```

### CI

This project is built on [GitHub Actions](https://github.com/bcmi-labs/arduino-editor/actions?query=workflow%3A%22Arduino+Pro+IDE%22).

 - _Snapshot_ builds run when changes are pushed to the `master` branch, or when a PR is created against the `master` branch. For the sake of the review and verification process, the build artifacts can be downloaded from the GitHub Actions page. Note: [due to a limitation](https://github.com/actions/upload-artifact/issues/80#issuecomment-630030144) with the GH Actions UI, you cannot download a particular build, but you have to get all together inside the `build-artifacts.zip`.
 - _Nightly_ builds run every day at 03:00 GMT from the `master` branch.
 - _Release_ builds run when a new tag is pushed to the remote. The tag must follow the [semver](https://semver.org/). For instance, `1.2.3` is a correct tag, but `v2.3.4` won't work. Steps to trigger a new release build:
   - Create a local tag:
    ```sh
    git tag -a 1.2.3 -m "Creating a new tag for the `1.2.3` release."
    ```
   - Push it to the remote:
   ```sh
    git push origin 1.2.3
   ```

