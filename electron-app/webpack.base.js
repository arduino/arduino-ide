// @ts-check
'use strict';

const chmodr = require('chmodr');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('node:path');
const fs = require('node:fs/promises');

const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';

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
  constructor(targetPath, patchTheia12780 = false) {
    this.targetPath = targetPath;
    this.patchTheia12780 = patchTheia12780;
  }

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.afterEmit.tap('PermissionsPlugin', () => {
      return new Promise(async (resolve, reject) => {
        if (this.patchTheia12780) {
          let trashBinaryFilename = undefined;
          if (isWindows) {
            trashBinaryFilename = 'windows-trash.exe';
          } else if (isMacOS) {
            trashBinaryFilename = 'macos-trash';
          }
          if (trashBinaryFilename) {
            await fs.chmod(
              path.join(__dirname, 'lib', 'backend', trashBinaryFilename),
              0o755
            );
          }
        }
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
 * @param {boolean|undefined} [patchTheia12780=true] to apply patch for https://github.com/eclipse-theia/theia/issues/12780. Only required in the production app.
 * @param {string|undefined} [baseDir=__dirname] to calculate the modules from. Defaults to `__dirname`
 */
function createCopyArduinoResourcesPlugins(
  targetPath,
  patchTheia12780 = false,
  baseDir = __dirname
) {
  const trashBinariesPath = path.join(
    resolvePackagePath('trash', baseDir),
    'lib'
  );
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

  if (patchTheia12780) {
    // workaround for https://github.com/eclipse-theia/theia/issues/12780
    // copy the Windows (`windows-trash.exe`) and macOS (`macos-trash`) executables for `trash`
    if (isWindows) {
      copyOptions.patterns.push({
        from: path.join(trashBinariesPath, 'windows-trash.exe'),
        to: path.resolve(__dirname, 'lib', 'backend'),
      });
    } else if (isMacOS) {
      copyOptions.patterns.push({
        from: path.join(trashBinariesPath, 'macos-trash'),
        to: path.resolve(__dirname, 'lib', 'backend'),
      });
    }
  }
  return [
    new CopyWebpackPlugin(copyOptions),
    new PermissionsPlugin(targetPath, patchTheia12780),
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
