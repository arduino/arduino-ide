// @ts-check
'use strict';

// `true` if the this (backend main) process has been forked.
if (process.send) {
  const util = require('util');
  for (const name of ['log', 'trace', 'debug', 'info', 'warn', 'error']) {
    console[name] = function () {
      // eslint-disable-next-line prefer-rest-params
      const args = Object.values(arguments);
      const message = util.format(...args);
      process.send?.({ severity: name, message }); // send the log message to the parent process (electron main)
    };
  }
}

require('./src-gen/backend/main');
