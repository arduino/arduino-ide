// Use `@grpc/grpc-js` instead of `grpc` at runtime.
// https://github.com/grpc/grpc-node/issues/624
(() => {
    const fs = require('fs');
    const path = require('path');
    const roots = ['src']; // XXX: patch the `lib` instead?
    console.info("🔧  >>> Patching code. Switching from 'grpc' to '@grpc/grpc-js'...");
    for (const root of roots) {
        const cliProtocolPath = path.resolve(__dirname, '..', root, 'node', 'cli-protocol');
        for (const fileName of fs.readdirSync(cliProtocolPath)) {
            const filePath = path.resolve(cliProtocolPath, fileName);
            let content = fs.readFileSync(filePath, { encoding: 'utf8' });
            if (content.indexOf("require('grpc')") !== -1) {
                console.info(`Updated require('grpc') to require('@grpc/grpc-js') in ${filePath}.`);
                fs.writeFileSync(filePath, content.replace("require('grpc')", "require('@grpc/grpc-js')"));
            }
            content = fs.readFileSync(filePath, { encoding: 'utf8' });
            if (content.indexOf('import * as grpc from "grpc"') !== -1) {
                console.info(`Updated import * as grpc from "grpc" to import * as grpc from "@grpc/grpc-js" in ${filePath}.`);
                fs.writeFileSync(filePath, content.replace('import * as grpc from "grpc"', 'import * as grpc from "@grpc/grpc-js"'));
            }
        }
    }
    console.info('👌  <<< Done. The code has been patched.');
})();
