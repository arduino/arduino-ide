// @ts-check
'use strict';

// Node.js 19+ enables keep-alive on the default HTTP agents, so `theia download:plugins`
// keeps running for several minutes after the download until the idle sockets are closed.
const http = require('node:http');
const https = require('node:https');

http.globalAgent = new http.Agent({ keepAlive: false });
https.globalAgent = new https.Agent({ keepAlive: false });

process.argv.splice(2, 0, 'download:plugins');
require('@theia/cli/lib/theia');
