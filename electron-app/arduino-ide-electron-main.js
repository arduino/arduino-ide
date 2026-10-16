// @ts-check
'use strict';

// The bundled Electron segfaults on startup with the native Wayland backend on some compositors (e.g. Hyprland).
// The Ozone platform is selected before this script runs, so `app.commandLine.appendSwitch` is too late. Relaunch with X11/XWayland instead.
// Users can still opt in to native Wayland with an explicit `--ozone-platform=wayland`.
// See https://github.com/arduino/arduino-ide/issues/2759 and https://github.com/arduino/arduino-ide/issues/2107.
const { app } = require('electron');
if (
  process.platform === 'linux' &&
  ['wayland', 'auto'].includes(
    process.env.ELECTRON_OZONE_PLATFORM_HINT || ''
  ) &&
  !process.argv.some((arg) => arg.startsWith('--ozone-platform'))
) {
  delete process.env.ELECTRON_OZONE_PLATFORM_HINT;
  app.relaunch({ args: [...process.argv.slice(1), '--ozone-platform=x11'] });
  app.exit(0);
}

const os = require('os');
const path = require('path');
const config = require('./package.json').theia.frontend.config;
// `buildDate` is only available in the bundled application.
if (config.buildDate) {
  // `plugins` folder inside IDE2. IDE2 is shipped with these VS Code extensions. Such as cortex-debug, vscode-cpp, and translations.
  process.env.THEIA_DEFAULT_PLUGINS = `local-dir:${path.resolve(
    __dirname,
    'plugins'
  )}`;
  // `plugins` folder inside the `~/.arduinoIDE` folder. This is for manually installed VS Code extensions. For example, custom themes.
  process.env.THEIA_PLUGINS = [
    process.env.THEIA_PLUGINS,
    `local-dir:${path.resolve(os.homedir(), '.arduinoIDE', 'plugins')}`,
  ]
    .filter(Boolean)
    .join(',');
}

require('./lib/backend/electron-main');
