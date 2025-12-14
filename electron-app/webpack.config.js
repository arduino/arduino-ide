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
// Ensure webpack can resolve the workspace package
if (!mainWindowConfig.resolve.alias) {
  mainWindowConfig.resolve.alias = {};
}
mainWindowConfig.resolve.alias['arduino-ide-extension'] = path.resolve(__dirname, '..', 'arduino-ide-extension');
// Ensure symlinks are followed
mainWindowConfig.resolve.symlinks = true;
// Add workspace root to module resolution
if (!mainWindowConfig.resolve.modules) {
  mainWindowConfig.resolve.modules = ['node_modules'];
}
if (!mainWindowConfig.resolve.modules.includes(path.resolve(__dirname, '..', 'node_modules'))) {
  mainWindowConfig.resolve.modules.push(path.resolve(__dirname, '..', 'node_modules'));
}
mainWindowConfig.plugins?.push(
  new webpack.ProvidePlugin({
    // Make a global `process` variable that points to the `process` package,
    // because the `util` package expects there to be a global variable named `process`.
    // Thanks to https://stackoverflow.com/a/65018686/14239942
    process: 'process/browser',
  })
);
const preloadConfig = frontend[2];

// Add alias for backend and preload configs too
if (!backend.config.resolve) {
  backend.config.resolve = {};
}
if (!backend.config.resolve.alias) {
  backend.config.resolve.alias = {};
}
backend.config.resolve.alias['arduino-ide-extension'] = path.resolve(__dirname, '..', 'arduino-ide-extension');
backend.config.resolve.symlinks = true;
if (!backend.config.resolve.modules) {
  backend.config.resolve.modules = ['node_modules'];
}
if (!backend.config.resolve.modules.includes(path.resolve(__dirname, '..', 'node_modules'))) {
  backend.config.resolve.modules.push(path.resolve(__dirname, '..', 'node_modules'));
}

if (!preloadConfig.resolve) {
  preloadConfig.resolve = {};
}
if (!preloadConfig.resolve.alias) {
  preloadConfig.resolve.alias = {};
}
preloadConfig.resolve.alias['arduino-ide-extension'] = path.resolve(__dirname, '..', 'arduino-ide-extension');
preloadConfig.resolve.symlinks = true;
if (!preloadConfig.resolve.modules) {
  preloadConfig.resolve.modules = ['node_modules'];
}
if (!preloadConfig.resolve.modules.includes(path.resolve(__dirname, '..', 'node_modules'))) {
  preloadConfig.resolve.modules.push(path.resolve(__dirname, '..', 'node_modules'));
}

// Copy all the IDE2 binaries and the plotter web app.
// XXX: For whatever reason it is important to use `unshift` instead of `push`, and execute the additional webpack plugins before the Theia contributed ones kick in. Otherwise ours do not work.
backend.config.plugins.unshift(
  ...createCopyArduinoResourcesPlugins(
    path.resolve(__dirname, 'lib', 'backend', 'resources')
  )
);

// Override the default entry from Theia as IDE2 has a customization of the module.
// Resolve the parcel-watcher entry point - use try/catch in case extension isn't built yet
let parcelWatcherPath;
try {
  parcelWatcherPath = require.resolve('arduino-ide-extension/lib/node/theia/filesystem/parcel-watcher/index');
} catch (e) {
  // Fallback to direct path - this will be resolved by webpack's resolver with the alias
  parcelWatcherPath = 'arduino-ide-extension/lib/node/theia/filesystem/parcel-watcher/index';
}
backend.config.entry['parcel-watcher'] = {
  import: parcelWatcherPath,
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
