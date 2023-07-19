// @ts-check

// Patch for on Linux when `XDG_CONFIG_HOME` is not available, `node-log-rotate` creates the folder with `undefined` name.
// See https://github.com/lemon-sour/node-log-rotate/issues/23 and https://github.com/arduino/arduino-ide/issues/394.
// If the IDE2 is running on Linux, and the `XDG_CONFIG_HOME` variable is not available, set it to avoid the `undefined` folder.
// From the specs: https://specifications.freedesktop.org/basedir-spec/latest/ar01s03.html
// "If $XDG_CONFIG_HOME is either not set or empty, a default equal to $HOME/.config should be used."
const os = require('os');
const util = require('util');
if (os.platform() === 'linux' && !process.env['XDG_CONFIG_HOME']) {
    const { join } = require('path');
    const home = process.env['HOME'];
    const xdgConfigHome = home ? join(home, '.config') : join(os.homedir(), '.config');
    process.env['XDG_CONFIG_HOME'] = xdgConfigHome;
}

const { setup, log } = require('node-log-rotate');
setup({
    appName: 'Arduino IDE',
    maxSize: 10 * 1024 * 1024
});
for (const name of ['log', 'trace', 'debug', 'info', 'warn', 'error']) {
    const original = console[name];
    console[name] = function () {
        const messages = Object.values(arguments);
        const message = util.format(...messages)
        original(message)
        log(message);
    }
}

const { BackendApplicationConfigProvider } = require('@theia/core/lib/node/backend-application-config-provider');
const main = require('@theia/core/lib/node/main');
BackendApplicationConfigProvider.set({
    "configDirName": ".arduinoIDE",
    "singleInstance": true
});

const serverModule = require('./server');
const serverAddress = main.start(serverModule());
serverAddress.then(function ({ port, address }) {
    if (process && process.send) {
        process.send({ port, address });
    }
});
module.exports = serverAddress;
