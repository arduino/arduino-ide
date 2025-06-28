# Arduino IDE 2.x (Special build)

### Preface

This repository is a fork of the official [Arduino IDE](https://github.com/arduino/arduino-ide).
It seams that this project is currently inactive (2 Month no commit), because my PR [Order custom board option menus as defined in platform configuration](https://github.com/arduino/arduino-ide/pull/2717) ist still not merged.
So this repo will generate only the AppImage whith my PR.
 
### Download

Latest: [Download](/../../releases/latest)

All Releases: [Releases](/../../releases)

[![Arduino2 IDE (Linux-AppImage-Build)](https://github.com/gneiss15/arduino-ide/actions/workflows/LinuxBuild.yml/badge.svg)](https://github.com/gneiss15/arduino-ide/actions/workflows/LinuxBuild.yml)
## All Below is from the original "Arduino IDE" Repo
<details>
  <summary>Show</summary>
<img src="https://content.arduino.cc/website/Arduino_logo_teal.svg" height="100" align="right" />

# Arduino IDE 2.x

[![Build status](https://github.com/arduino/arduino-ide/actions/workflows/build.yml/badge.svg)](https://github.com/arduino/arduino-ide/actions/workflows/build.yml)
[![Check JavaScript status](https://github.com/arduino/arduino-ide/actions/workflows/check-javascript.yml/badge.svg)](https://github.com/arduino/arduino-ide/actions/workflows/check-javascript.yml)
[![Test JavaScript status](https://github.com/arduino/arduino-ide/actions/workflows/test-javascript.yml/badge.svg)](https://github.com/arduino/arduino-ide/actions/workflows/test-javascript.yml)

This repository contains the source code of the Arduino IDE 2.x. If you're looking for the old IDE, go to the [repository of the 1.x version](https://github.com/arduino/Arduino).

The Arduino IDE 2.x is a major rewrite, sharing no code with the IDE 1.x. It is based on the [Theia IDE](https://theia-ide.org/) framework and built with [Electron](https://www.electronjs.org/). The backend operations such as compilation and uploading are offloaded to an [arduino-cli](https://github.com/arduino/arduino-cli) instance running in daemon mode. This new IDE was developed with the goal of preserving the same interface and user experience of the previous major version in order to provide a frictionless upgrade.

![](static/screenshot.png)

## Download

You can download the latest release version and nightly builds from the [software download page on the Arduino website](https://www.arduino.cc/en/software).

## Support

If you need assistance, see the [Help Center](https://support.arduino.cc/hc/en-us/categories/360002212660-Software-and-Downloads) and browse the [forum](https://forum.arduino.cc/index.php?board=150.0).

## Bugs & Issues

If you want to report an issue, you can submit it to the [issue tracker](https://github.com/arduino/arduino-ide/issues) of this repository.

See [**the issue report guide**](docs/contributor-guide/issues.md#issue-report-guide) for instructions.

### Security

If you think you found a vulnerability or other security-related bug in this project, please read our
[security policy](https://github.com/arduino/arduino-ide/security/policy) and report the bug to our Security Team 🛡️
Thank you!

e-mail contact: security@arduino.cc

## Contributions and development

Contributions are very welcome! There are several ways to participate in this project, including:

- Fixing bugs
- Beta testing
- Translation

See [**the contributor guide**](docs/CONTRIBUTING.md#contributor-guide) for more information.

See the [**development guide**](docs/development.md) for a technical overview of the application and instructions for building the code.

## Donations

This open source code was written by the Arduino team and is maintained on a daily basis with the help of the community. We invest a considerable amount of time in development, testing and optimization. Please consider [donating](https://www.arduino.cc/en/donate/) or [sponsoring](https://github.com/sponsors/arduino) to support our work, as well as [buying original Arduino boards](https://store.arduino.cc/) which is the best way to make sure our effort can continue in the long term.

## License

The code contained in this repository and the executable distributions are licensed under the terms of the GNU AGPLv3. The executable distributions contain third-party code licensed under other compatible licenses such as GPLv2, MIT and BSD-3. If you have questions about licensing please contact us at [license@arduino.cc](mailto:license@arduino.cc).
</details>

