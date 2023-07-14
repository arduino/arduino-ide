const chmodr = require('chmodr');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('node:path');
const resolvePackagePath = require('resolve-package-path');
const webpack = require('webpack');
const frontend = require('./gen-webpack.config');
const backend = require('./gen-webpack.node.config');

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

// Taken from https://github.com/eclipse-theia/theia-blueprint/blob/022878d5488c47650fb17b5fdf49a28be88465fe/applications/electron/webpack.config.js#L18-L21
if (process.platform !== 'win32') {
  // For some reason, blueprint wants to bundle the `.node` files directly without going through `@vscode/windows-ca-certs`
  backend.ignoredResources.add(
    '@vscode/windows-ca-certs/build/Release/crypt32.node'
  );
}

// restore file permissions after webpack copy
// https://github.com/webpack-contrib/copy-webpack-plugin/issues/35#issuecomment-1407280257
class PermissionsPlugin {
  /**
   *
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.afterEmit.tap('PermissionsPlugin', () => {
      return new Promise((resolve, reject) => {
        chmodr(
          path.join(__dirname, 'lib', 'backend', 'resources'),
          0o755,
          (err) => (err ? reject(err) : resolve())
        );
      });
    });
  }
}

// Copy all the IDE2 binaries and the plotter web app.
// XXX: For whatever reason it is important to use `unshift` instead of `push`, and execute the additional webpack plugins before the Theia contributed ones kick in. Otherwise ours do not work.
backend.config.plugins.unshift(
  new CopyWebpackPlugin({
    patterns: [
      // binaries
      {
        from: path.join(
          resolvePackagePath('arduino-ide-extension', __dirname),
          '..',
          'src',
          'node',
          'resources'
        ),
        to: path.resolve(__dirname, 'lib', 'backend', 'resources'),
        globOptions: {
          ignore: ['**/i18n/**'],
        },
      },
      // plotter app
      {
        from: path.join(
          resolvePackagePath('arduino-serial-plotter-webapp', __dirname),
          '..',
          'build'
        ),
        to: path.resolve(
          __dirname,
          'lib',
          'backend',
          'resources',
          'arduino-serial-plotter-webapp'
        ),
      },
    ],
  }),
  new PermissionsPlugin()
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

// Do not include the `secondary-window` configuration from Theia. It's unused in IDE2, and can save up to ~30MB final app size.
module.exports = [mainWindowConfig, preloadConfig, backend.config];
