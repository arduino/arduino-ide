//@ts-check
// Patches the `src-gen/backend/main.js` so that the forked backend process has the `process.versions.electron` in the bundled electron app.
// https://github.com/eclipse-theia/theia/issues/7358#issue-583306096

const args = process.argv.slice(2);
if (!args.length) {
    console.error(`Expected an argument pointing to the app folder. An app folder is where you have the package.json and src-gen folder.`);
    process.exit(1);
}
if (args.length > 1) {
    console.error(`Expected exactly one argument pointing to the app folder. Got multiple instead: ${JSON.stringify(args)}`);
    process.exit(1);
}
const arg = args.shift();
if (!arg) {
    console.error('App path was not specified.');
    process.exit(1);
}

const fs = require('fs');
const path = require('path');
const appPath = path.resolve((path.isAbsolute(arg) ? path.join(process.cwd(), arg) : arg));
if (!fs.existsSync(appPath)) {
    console.error(`${appPath} does not exist.`);
    process.exit(1);
}

if (!fs.lstatSync(appPath).isDirectory()) {
    console.error(`${appPath} is not a directory.`);
    process.exit(1);
}

const patched = path.join(appPath, 'src-gen', 'backend', 'original-main.js');
if (fs.existsSync(patched)) {
    console.error(`Already patched. ${patched} already exists.`);
    process.exit(1);
}

const toPatch = path.join(appPath, 'src-gen', 'backend', 'main.js');
if (fs.existsSync(patched)) {
    console.error(`Cannot patch. ${toPatch} does not exist.`);
    process.exit(1);
}

console.log(`⏱️  >>> Patching ${toPatch}...`);

const originalContent = fs.readFileSync(toPatch, { encoding: 'utf8' });
const patchedContent = `if (typeof process.versions.electron === 'undefined' && typeof process.env.THEIA_ELECTRON_VERSION === 'string') {
    process.versions.electron = process.env.THEIA_ELECTRON_VERSION;
}
require('./original-main');
`

fs.writeFileSync(patched, originalContent);
fs.writeFileSync(toPatch, patchedContent);

console.log(`👌 <<< Patched ${toPatch}. Original 'main.js' is now at ${patched}.`);
