<img src="https://content.arduino.cc/website/Arduino_logo_teal.svg" height="100" align="right" />

# CognifyEV AI-Powered Arduino IDE

[![Build status](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/build.yml/badge.svg)](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/build.yml)
[![Check JavaScript status](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/check-javascript.yml/badge.svg)](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/check-javascript.yml)
[![Test JavaScript status](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/test-javascript.yml/badge.svg)](https://github.com/CognifyEVOrg/arduino-ide/actions/workflows/test-javascript.yml)

> **⚠️ This is a fork of [Arduino IDE 2.x](https://github.com/arduino/arduino-ide)** - An AI-powered agentic IDE for embedded computers, built upon the excellent foundation of the Arduino IDE 2.x.

This repository is a fork of the Arduino IDE 2.x, enhanced with AI capabilities to create an intelligent, agentic development environment for embedded systems. 

**Original Project**: This codebase is based on [Arduino IDE 2.x](https://github.com/arduino/arduino-ide), which is a major rewrite of the original IDE. It is based on the [Theia IDE](https://theia-ide.org/) framework and built with [Electron](https://www.electronjs.org/). The backend operations such as compilation and uploading are offloaded to an [arduino-cli](https://github.com/arduino/arduino-cli) instance running in daemon mode.

## 🚀 AI-Powered Features (In Development)

This fork extends the Arduino IDE with AI capabilities for:

- **AI Code Generation**: Generate Arduino sketches from natural language descriptions
- **Intelligent Code Completion**: Context-aware suggestions powered by AI
- **Agentic Workflows**: Autonomous code analysis, optimization, and debugging
- **Smart Board Detection**: AI-assisted board selection and configuration
- **Embedded AI Assistant**: Real-time help and suggestions during development

## 📦 Installation & Setup

For development setup instructions, see [DEV_SETUP.md](DEV_SETUP.md).

![](static/screenshot.png)

## 📥 Download

> **Note**: Pre-built releases for this fork are coming soon. For now, please build from source (see [DEV_SETUP.md](DEV_SETUP.md)).

For the original Arduino IDE, you can download from the [official Arduino website](https://www.arduino.cc/en/software).

## 💬 Support

- **Issues & Bugs**: Report issues in this repository's [issue tracker](https://github.com/CognifyEVOrg/arduino-ide/issues)
- **Original IDE Support**: See the [Arduino Help Center](https://support.arduino.cc/hc/en-us/categories/360002212660-Software-and-Downloads) and [forum](https://forum.arduino.cc/index.php?board=150.0)

See [**the issue report guide**](docs/contributor-guide/issues.md#issue-report-guide) for instructions.

### 🔒 Security

If you think you found a vulnerability or other security-related bug in this project, please report it by creating a [security advisory](https://github.com/CognifyEVOrg/arduino-ide/security/advisories/new) in this repository.

For the original Arduino IDE security issues, contact [security@arduino.cc](mailto:security@arduino.cc).

## 🤝 Contributions and Development

Contributions are very welcome! This fork maintains compatibility with the original Arduino IDE while adding AI capabilities.

### Contributing to This Fork

- **AI Features**: Help us build AI-powered capabilities for embedded development
- **Bug Fixes**: Fix bugs in both original and new features
- **Documentation**: Improve documentation for AI features
- **Testing**: Test AI capabilities with various embedded platforms

See [**the contributor guide**](docs/CONTRIBUTING.md#contributor-guide) for more information (from the original project).

See the [**development guide**](docs/development.md) and [**DEV_SETUP.md**](DEV_SETUP.md) for setup instructions.

### Contributing to the Original Project

This fork is based on the excellent work of the Arduino team. Please consider:
- Contributing to the [original Arduino IDE](https://github.com/arduino/arduino-ide) project
- [Buying original Arduino boards](https://store.arduino.cc/) to support the Arduino project
- Reporting issues to the [original repository](https://github.com/arduino/arduino-ide/issues) for upstream bugs

## 📄 License

The code contained in this repository and the executable distributions are licensed under the terms of the **GNU AGPLv3**. The executable distributions contain third-party code licensed under other compatible licenses such as GPLv2, MIT and BSD-3.

This project maintains the same license as the [original Arduino IDE](https://github.com/arduino/arduino-ide), which requires that any modifications to this codebase also be licensed under AGPLv3.

### Attribution

This project is a fork of [Arduino IDE 2.x](https://github.com/arduino/arduino-ide) by Arduino SA, licensed under AGPL-3.0-or-later. We acknowledge and thank the Arduino team for their excellent work.

---

## 🔗 Links

- **This Fork**: [CognifyEVOrg/arduino-ide](https://github.com/CognifyEVOrg/arduino-ide)
- **Original Project**: [arduino/arduino-ide](https://github.com/arduino/arduino-ide)
- **Original Arduino IDE 1.x**: [arduino/Arduino](https://github.com/arduino/Arduino)
- **Arduino CLI**: [arduino/arduino-cli](https://github.com/arduino/arduino-cli)
