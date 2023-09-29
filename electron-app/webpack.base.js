// @ts-check
'use strict';

const chmodr = require('chmodr');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('node:path');

/**
 * @param {string} target the name of the `npm` package to resolve.
 */
function resolvePackagePath(target, baseDir = __dirname) {
  const resolvePackageJsonPath = require('resolve-package-path');
  const packageJsonPath = resolvePackageJsonPath(target, baseDir);
  if (!packageJsonPath) {
    throw new Error(
      `Could not resolve package '${target}'. Base dir: ${baseDir}`
    );
  }
  return path.join(packageJsonPath, '..'); // one level up to locate the package folder
}

// restore file permissions after webpack copy
// https://github.com/webpack-contrib/copy-webpack-plugin/issues/35#issuecomment-1407280257
class PermissionsPlugin {
  /**
   * @param {string} targetPath
   */
  constructor(targetPath) {
    this.targetPath = targetPath;
  }

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.afterEmit.tap('PermissionsPlugin', () => {
      return new Promise(async (resolve, reject) => {
        chmodr(this.targetPath, 0o755, (err) =>
          err ? reject(err) : resolve(undefined)
        );
      });
    });
  }
}

/**
 * Creates webpack plugins to copy all required resources (binaries, plotter app, translation files, etc.) to the appropriate location.
 * @param {string} targetPath where to copy the resources
 * @param {string|undefined} [baseDir=__dirname] to calculate the modules from. Defaults to `__dirname`
 */
function createCopyArduinoResourcesPlugins(targetPath, baseDir = __dirname) {
  const copyOptions = {
    patterns: [
      // binaries
      {
        from: path.join(
          resolvePackagePath('arduino-ide-extension', baseDir),
          'src',
          'node',
          'resources'
        ),
        to: targetPath,
        globOptions: {
          ignore: ['**/i18n/**'],
        },
      },
      // plotter app
      {
        from: path.join(
          resolvePackagePath('arduino-serial-plotter-webapp', baseDir),
          'build'
        ),
        to: path.resolve(targetPath, 'arduino-serial-plotter-webapp'),
      },
    ],
  };
  return [
    new CopyWebpackPlugin(copyOptions),
    new PermissionsPlugin(targetPath),
  ];
}

/**
 * Removes the compression webpack plugin if it's set in the config. Otherwise, it's NOOP>
 * @param {import('webpack').Configuration} config
 */
function removeCompressionPlugin(config) {
  const CompressionPlugin = require('compression-webpack-plugin');
  for (let i = config.plugins?.length || 0; i >= 0; i--) {
    const plugin = config.plugins?.[i];
    if (plugin instanceof CompressionPlugin) {
      config.plugins?.splice(i, 1);
    }
  }
}

module.exports = {
  createCopyArduinoResourcesPlugins,
  removeCompressionPlugin,
};
