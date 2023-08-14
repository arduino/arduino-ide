// When running in development mode, do not webpack the backend and electron main modules.
// It does not work in watch mode: https://github.com/eclipse-theia/theia/issues/12793.
const path = require('node:path');
const configs = require('./webpack.config');
const { createCopyArduinoResourcesPlugins } = require('./webpack.base');
const [mainWindowConfig, preloadConfig] = configs;

// Use the frontend's webpack config to copy the required resources to the `./arduino-ide-extension/lib/node/resources` folder.
mainWindowConfig.plugins?.push(
  ...createCopyArduinoResourcesPlugins(
    path.join(
      __dirname,
      '..',
      'arduino-ide-extension',
      'lib',
      'node',
      'resources'
    )
  )
);

module.exports = [mainWindowConfig, preloadConfig];
