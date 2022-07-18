// @ts-check
const config = require('./gen-webpack.config.js');
const path = require('path');

// Load the patched `index.js` that sets the desired theme in IDE2 based on the OS' theme.
// The `patch/frontend/index.js` will require the original, generated `index.js`.
// See: https://github.com/arduino/arduino-ide/pull/1160.
config.entry.bundle = path.resolve(__dirname, 'patch/frontend/index.js');

module.exports = config;
