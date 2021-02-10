//@ts-check

const fs = require('fs');
const path = require('path');
const semver = require('semver');

const targetVersion = process.argv.slice(2).shift();
const repoRootPath = path.join(__dirname, '..');
const { version: currentVersion } = require(path.join(repoRootPath, 'package.json'));

if (!targetVersion) {
    console.error('Target version was not specified. Target version must be a valid semver. Use: `yarn update:version x.y.z` to update the versions.');
    process.exit(1);
}

if (!semver.valid(targetVersion)) {
    console.error(`Target version '${targetVersion}' is not a valid semver. Use: \`yarn update:version x.y.z\` to update the versions.`);
    process.exit(1);
}

if (!semver.gt(targetVersion, currentVersion)) {
    console.error(`Target version '${targetVersion}' must be greater than the current version '${currentVersion}'.`);
    process.exit(1);
}

console.log(`🛠️ Updating current version from '${currentVersion}' to '${targetVersion}':`);
for (const toUpdate of [
    path.join(repoRootPath, 'package.json'),
    path.join(repoRootPath, 'electron-app', 'package.json'),
    path.join(repoRootPath, 'browser-app', 'package.json'),
    path.join(repoRootPath, 'arduino-ide-extension', 'package.json')
]) {
    process.stdout.write(`  Updating ${toUpdate}'...`);
    const pkg = require(toUpdate);
    pkg.version = targetVersion;
    if ('dependencies' in pkg) {
        for (const dep of Object.keys(pkg['dependencies'])) {
            if (dep.startsWith('arduino-')) {
                pkg['dependencies'][dep] = targetVersion;
            }
        }
    }
    fs.writeFileSync(toUpdate, JSON.stringify(pkg, null, 2) + '\n');
    process.stdout.write(` ✅ Done.\n`);
}

console.log(`Done. The new version is '${targetVersion}' now. Commit your changes and tag the code for the release. 🚢`);
