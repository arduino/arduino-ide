/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
// @ts-check
const config = require('./gen-webpack.config.js');

config.resolve.fallback['http'] = false;
config.resolve.fallback['fs'] = false;

/**
 * Expose bundled modules on window.theia.moduleName namespace, e.g.
 * window['theia']['@theia/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
config.module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@theia/application-manager/lib/expose-loader')
}); */


// Load the patched `index.js` that sets the desired theme in IDE2 based on the OS' theme.
// The `patch/frontend/index.js` will require the original, generated `index.js`.
// See: https://github.com/arduino/arduino-ide/pull/1160.
config.entry.bundle = require('path').resolve(__dirname, 'patch/frontend/index.js');

module.exports = config;