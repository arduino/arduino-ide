# Advanced usage

## Advanced settings

The Arduino IDE's primary settings are accessible via the **File > Preferences** menu item. These provide all the configuration capability required by the average user to develop sketches.

Arduino IDE has some additional settings which may be of interest to advanced users who want to do things such as fine tune the behavior of the application or increase log output while investigating a problem.

These advanced settings can be accessed by the following procedure:

1. Press the <kbd>**Ctrl**</kbd>+<kbd>**Shift**</kbd>+<kbd>**P**</kbd> keyboard shortcut (<kbd>**Command**</kbd>+<kbd>**Shift**</kbd>+<kbd>**P**</kbd> for macOS users) to open the "**Command Palette**".
1. Select the "**Preferences: Open Settings (UI)**" command from the menu.

This will open a "**Preferences**" view in the IDE. Once you are finished adjusting settings, it can be closed by clicking the **X** icon on the "**Preferences**" tab.

## 3rd party themes

Arduino IDE is built on the [**Eclipse Theia** IDE framework](https://theia-ide.org/), which allows it to use [**VS Code**](https://code.visualstudio.com/) themes.

---

❗ Arduino does not maintain or provide support for individual 3rd party themes. If you experience problems with a theme, report it to the theme's maintainer.

---

### Obtaining themes

A large selection of free VS Code themes are available from the **Visual Studio Marketplace** website:

1. Find a theme you want to install: <br />
   https://marketplace.visualstudio.com/search?target=VSCode&category=Themes
1. Click on the theme to open its extension page.
1. Click the "**Download Extension**" link on the right side of the extension page.
1. Wait for the download to finish.

### Installation

1. If Arduino IDE is running, select **File > Quit** from the Arduino IDE menus to exit all windows.
1. Create a folder named `plugins` under Arduino IDE's configuration folder:
   - **Windows:**
     ```text
     C:\Users\<username>\.arduinoIDE\
     ```
     (where `<username>` is your Windows username)
   - **Linux:**
     ```text
     ~/.arduinoIDE/
     ```
     ❗ The `.arduinoIDE` folder is hidden by default in the file manager and terminal.
   - **macOS:**
     ```text
     ~/.arduinoIDE/
     ```
     ❗ The `.arduinoIDE` folder is hidden by default. You can make it visible by pressing the <kbd>**Command**</kbd>+<kbd>**Shift**</kbd>+<kbd>**.**</kbd> keyboard shortcut.
1. Copy the downloaded theme file to the `plugins` folder you created.
1. Start Arduino IDE.
1. Select **File > Preferences** from the Arduino IDE menus. <br />
   The "**Preferences**" dialog will open.
1. Select the name of the new theme from the "**Theme**" menu in the "**Preferences**" dialog.
1. Click the "**OK**" button.

### Uninstall

If you later decide you would like to remove a 3rd party theme you installed, it can be done by following these instructions:

1. If Arduino IDE is running, select **File > Quit** from the Arduino IDE menus to exit all windows.
1. Delete the theme's `.vsix` file from [the location you installed it to](#installation). <br />
   ⚠ Please be careful when deleting things from your computer. When in doubt, back up!
