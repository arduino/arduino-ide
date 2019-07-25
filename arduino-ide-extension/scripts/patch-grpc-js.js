// Use `@grpc/grpc-js` instead of `grpc` at runtime.
// https://github.com/grpc/grpc-node/issues/624
// https://github.com/grpc/grpc-node/issues/931

const fs = require('fs');
const path = require('path');

module.exports.patch = function (roots = [path.join(__dirname, '..', 'src', 'node')]) {
    console.info('🔧  <<< Patching code...');
    patch(roots);
    console.info('👌  <<< Done. The code has been patched.');
};

function patch(paths) {
    for (const p of paths) {
        const exist = fs.existsSync(p);
        if (exist) {
            const stat = fs.statSync(p);
            if (stat.isDirectory()) {
                console.info(`🔧  >>> Scanning code in ${p}...`);
                patch(fs.readdirSync(p).map(name => path.join(p, name)));
            } else {
                let content = fs.readFileSync(p, { encoding: 'utf8' });
                if (content.indexOf("require('grpc')") !== -1) {
                    console.info(`Updated require('grpc') to require('@grpc/grpc-js') in ${p}.`);
                    fs.writeFileSync(p, content.replace("require('grpc')", "require('@grpc/grpc-js')"));
                }
                content = fs.readFileSync(p, { encoding: 'utf8' });
                if (content.indexOf('import * as grpc from "grpc"') !== -1) {
                    console.info(`Updated import * as grpc from "grpc" to import * as grpc from "@grpc/grpc-js" in ${p}.`);
                    fs.writeFileSync(p, content.replace('import * as grpc from "grpc"', 'import * as grpc from "@grpc/grpc-js"'));
                }
            }
        } else {
            console.warn(`${p} does not exist. Skipping.`);
        }
    }
}