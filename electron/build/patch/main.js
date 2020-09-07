// @ts-check
const { setup, log } = require('node-log-rotate');
setup({
    appName: 'Arduino Pro IDE',
    maxSize: 10 * 1024 * 1024
});
for (const name of ['log', 'trace', 'info', 'warn', 'error']) {
    const original = console[name];
    console[name] = (data => {
        original(data);
        log(data);
    }).bind(console);
}

const { BackendApplicationConfigProvider } = require('@theia/core/lib/node/backend-application-config-provider');
const main = require('@theia/core/lib/node/main');
BackendApplicationConfigProvider.set({
    "configDirName": ".arduinoProIDE",
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
