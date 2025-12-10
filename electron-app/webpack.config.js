const path = require('node:path');
const fs = require('fs');
const webpack = require('webpack');
const TheiaNativeWebpackPlugin = require('@theia/native-webpack-plugin');
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
backend.config.entry['parcel-watcher'] = {
  import: require.resolve(
    'arduino-ide-extension/lib/node/theia/filesystem/parcel-watcher'
  ),
  library: {
    type: 'commonjs2',
  },
};

// Override Theia native dependency bundler to assign stricter file permissions (chmod 755)
// https://github.com/eclipse-theia/theia/blob/9a52544fb4c1ea1d3d0d6bcbe106b97184279030/dev-packages/native-webpack-plugin/src/native-webpack-plugin.ts#L149
class NativeWebpackPlugin extends TheiaNativeWebpackPlugin {
  // Override the method that writes/copies files
  async copyExecutable(source, target) {
    const targetDirectory = path.dirname(target);
    await fs.promises.mkdir(targetDirectory, { recursive: true });
    await fs.promises.copyFile(source, target);
    await fs.promises.chmod(target, 0o755);
  }
}
backend.config.plugins.push(new NativeWebpackPlugin({
  out: 'native',
  trash: true,
  ripgrep: true,
  pty: true,
  nativeBindings: {
    drivelist: 'drivelist/build/Release/drivelist.node',
  },
}));

// Use a customized backend main that can enable the file logger in bundled mode.
backend.config.entry['main'] = require.resolve('./arduino-ide-backend-main.js');

backend.config.optimization.splitChunks = false;
backend.config.optimization.concatenateModules = true;

// Removed GZIP compression: the frontend is on the same machine as the backend.
removeCompressionPlugin(mainWindowConfig);
removeCompressionPlugin(preloadConfig);

// Do not include the `secondary-window` configuration from Theia. It's unused in IDE2, and can save up to ~30MB final app size.
module.exports = [mainWindowConfig, preloadConfig, backend.config];
