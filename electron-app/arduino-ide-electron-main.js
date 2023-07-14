// @ts-check
'use strict';

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
  // Enables the file logger in the backend process.
  process.env.IDE2_FILE_LOGGER = 'true';
}

require('./lib/backend/electron-main');
