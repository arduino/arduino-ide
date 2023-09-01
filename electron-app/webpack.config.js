const path = require('node:path');
const webpack = require('webpack');
const frontend = require('./gen-webpack.config');
const backend = require('./gen-webpack.node.config');
const {
  createCopyArduinoResourcesPlugins,
  removeCompressionPlugin,
} = require('./webpack.base');

// https://github.com/browserify/node-util/issues/57#issuecomment-764436352
const mainWindowConfig = frontend[0];
mainWindowConfig.resolve.extensions.push('.ts');
mainWindowConfig.resolve.fallback['util'] = require.resolve('util/');
mainWindowConfig.plugins?.push(
  new webpack.ProvidePlugin({
    // Make a global `process` variable that points to the `process` package,
    // because the `util` package expects there to be a global variable named `process`.
    // Thanks to https://stackoverflow.com/a/65018686/14239942
    process: 'process/browser',
  })
);
const preloadConfig = frontend[2];

// Copy all the IDE2 binaries and the plotter web app.
// XXX: For whatever reason it is important to use `unshift` instead of `push`, and execute the additional webpack plugins before the Theia contributed ones kick in. Otherwise ours do not work.
backend.config.plugins.unshift(
  ...createCopyArduinoResourcesPlugins(
    path.resolve(__dirname, 'lib', 'backend', 'resources')
  )
);

// Override the default entry from Theia as IDE2 has a customization of the module.
backend.config.entry['nsfw-watcher'] = {
  import: require.resolve(
    'arduino-ide-extension/lib/node/theia/filesystem/nsfw-watcher'
  ),
  library: {
    type: 'commonjs2',
  },
};

// Use a customized backend main that can enable the file logger in bundled mode.
backend.config.entry['main'] = require.resolve('./arduino-ide-backend-main.js');

backend.config.optimization.splitChunks = false;
backend.config.optimization.concatenateModules = true;

// Removed GZIP compression: the frontend is on the same machine as the backend.
removeCompressionPlugin(mainWindowConfig);
removeCompressionPlugin(preloadConfig);

// Do not include the `secondary-window` configuration from Theia. It's unused in IDE2, and can save up to ~30MB final app size.
module.exports = [mainWindowConfig, preloadConfig, backend.config];
