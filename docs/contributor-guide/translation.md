# Translator Guide

The text of the Arduino IDE interface is translated into several languages. The language can be selected in the dialog opened via **File > Preferences** in the Arduino IDE menus (**Arduino IDE > Preferences** for macOS users).

Translating text and improving on existing translations is a valuable contribution to the project, helping make Arduino accessible to everyone.

The translations for the text found in the Arduino IDE come from several sources:

## Arduino IDE Text

Translations of Arduino IDE's text is done in the "**Arduino IDE 2.0**" project on the **Transifex** localization platform:

https://explore.transifex.com/arduino-1/ide2/

## Base Application Text

Arduino IDE leverages the localization data available for the [**VS Code**](https://code.visualstudio.com/) editor to localize shared UI text. This reduces the translation work required to add a new language to the text specific to the Arduino IDE project.

For this reason, some of Arduino IDE's text is not found in the **Transifex** project. Suggestions for corrections or improvement to this text are made by submitting an issue to the `microsoft/vscode-loc` GitHub repository.

Before submitting an issue, please check the existing issues to make sure it wasn't already reported:<br />
https://github.com/microsoft/vscode-loc/issues

After that, submit an issue here:<br />
https://github.com/microsoft/vscode-loc/issues/new

## Arduino CLI Text

The [**Arduino CLI**](https://arduino.github.io/arduino-cli/latest/) tool handles non-GUI operations for the Arduino IDE. Some of the text printed in the "**Output**" panel and in notifications originates from **Arduino CLI**.

Translations of Arduino CLI's text is done in the "**Arduino CLI**" Transifex project:

https://explore.transifex.com/arduino-1/arduino-cli/
