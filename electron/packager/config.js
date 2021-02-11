//@ts-check

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const merge = require('deepmerge');
const dateFormat = require('dateformat');
const { isNightly, isRelease, git } = require('./utils');

function artifactName() {
    const { platform, arch } = process;
    const id = (() => {
        if (isRelease) {
            return getVersion();
        } else if (isNightly) {
            return `nightly-${timestamp()}`
        } else {
            return getVersion();
        }
    })();
    const name = 'arduino-ide';
    switch (platform) {
        case 'win32': {
            if (arch === 'x64') {
                return `${name}_${id}_Windows_64bit.\$\{ext}`;
            }
            throw new Error(`Unsupported platform, arch: ${platform}, ${arch}`);
        }
        case 'darwin': {
            return `${name}_${id}_macOS_64bit.\$\{ext}`;
        }
        case 'linux': {
            switch (arch) {
                case 'arm': {
                    return `${name}_${id}_Linux_ARMv7.\$\{ext}`;
                }
                case 'arm64': {
                    return `${name}_${id}_Linux_ARM64.\$\{ext}`;
                }
                case 'x64': {
                    return `${name}_${id}_Linux_64bit.\$\{ext}`;
                }
                default: {
                    throw new Error(`Unsupported platform, arch: ${platform}, ${arch}`);
                }
            }
        }
        default: throw new Error(`Unsupported platform, arch: ${platform}, ${arch}`);
    }
}

function electronPlatform() {
    switch (process.platform) {
        case 'win32': {
            return 'win';
        }
        case 'darwin': {
            return 'mac';
        }
        case 'linux': {
            return 'linux';
        }
        default: throw new Error(`Unsupported platform: ${process.platform}.`);
    }
}

function getVersion() {
    const repositoryRootPath = git('rev-parse --show-toplevel');
    let version = JSON.parse(fs.readFileSync(path.join(repositoryRootPath, 'package.json'), { encoding: 'utf8' })).version;
    if (!semver.valid(version)) {
        throw new Error(`Could not read version from root package.json. Version was: '${version}'.`);
    }
    if (!isRelease) {
        if (isNightly) {
            version = `${version}-nightly.${timestamp()}`;
        } else {
            version = `${version}-snapshot.${currentCommitish()}`;
        }
        if (!semver.valid(version)) {
            throw new Error(`Invalid patched version: '${version}'.`);
        }
    }
    return version;
}

function timestamp() {
    return dateFormat(new Date(), 'yyyymmdd');
}

function currentCommitish() {
    return git('rev-parse --short HEAD');
}

// function currentBranch() {
//     return git('rev-parse --abbrev-ref HEAD');
// }

function generateTemplate(buildDate) {
    // do `export PUBLISH=true yarn package` if you want to mimic CI build locally.
    // const electronPublish = release || (isCI && currentBranch() === 'main') || process.env.PUBLISH === 'true';
    const version = getVersion();
    const productName = 'Arduino IDE';
    const name = 'arduino-ide';
    let customizations = {
        name,
        description: productName,
        version,
        build: {
            productName,
            appId: 'arduino.ProIDE',
            [electronPlatform()]: {
                artifactName: artifactName()
            }
        }
    };
    if (buildDate) {
        customizations = merge(customizations, { theia: { frontend: { config: { buildDate } } } });
    }
    const template = require('../build/template-package.json');
    return merge(template, customizations);
}

module.exports = { generateTemplate };
