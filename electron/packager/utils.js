//@ts-check

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const depcheck = require('depcheck');

/**
 * Returns with the version info for the artifact.
 * If the `RELEASE_TAG` environment variable is set, we us that.
 * Falls back to the commit SHA if the `RELEASE_TAG` is the `$(Release.Tag)` string.
 * Otherwise, we concatenate the version of the extracted from `theia-app/electron-app/package.json`
 * and append the short commit SHA.
 */
function versionInfo() {
    if (typeof process.env.RELEASE_TAG === 'undefined' || !process.env.RELEASE_TAG || /* Azure -> */ process.env.RELEASE_TAG === '$(Release.Tag)') {
        return {
            version: `${targetVersion()}-${currentCommitish()}`,
            release: false
        }
    } else {
        return {
            version: process.env.RELEASE_TAG,
            release: true
        }
    }
}

/**
 * Returns with the absolute path of the `theia-app/electron-app/`.
 */
function arduinoExtensionPath() {
    // TODO: be smarter and locate the extension with Git: `git rev-parse --show-toplevel`.
    return path.join(__dirname, '..', '..', 'arduino-ide-extension');
}

/**
 * The version extracted from the `package.json` of the `arduino-ide-extension`. Falls back to `x.x.x`.
 */
function targetVersion() {
    return JSON.parse(fs.readFileSync(path.join(arduinoExtensionPath(), 'package.json'), { encoding: 'utf8' })).version || 'x.x.x';
}

/**
 * Returns with the trimmed result of the `git rev-parse --short HEAD` as the current commitish if `git` is on the `PATH`.
 * Otherwise, it returns with `DEV_BUILD`.
 */
function currentCommitish() {
    try {
        const gitPath = shell.which('git');
        const error = shell.error();
        if (error) {
            throw new Error(error);
        }
        const { stderr, stdout } = shell.exec(`"${gitPath}" rev-parse --short HEAD`, { silent: true });
        if (stderr) {
            throw new Error(stderr.toString().trim());
        }
        return stdout.toString().trim();
    } catch (e) {
        return 'DEV_BUILD';
    }
}

/**
 * Resolves to an array of `npm` package names that are declared in the `package.json` but **not** used by the project.
 */
function collectUnusedDependencies(pathToProject = process.cwd()) {
    const p = path.isAbsolute(pathToProject) ? pathToProject : path.resolve(process.cwd(), pathToProject);
    console.log(`⏱️  >>> Collecting unused backend dependencies for ${p}.`);
    return new Promise(resolve => {
        depcheck(p, {
            ignoreDirs: [
                'frontend'
            ],
            parsers: {
                '*.js': depcheck.parser.es6,
                '*.jsx': depcheck.parser.jsx
            },
            detectors: [
                depcheck.detector.requireCallExpression,
                depcheck.detector.importDeclaration
            ],
            specials: [
                depcheck.special.eslint,
                depcheck.special.webpack
            ]
        }, unused => {
            const { dependencies } = unused
            if (dependencies && dependencies.length > 0) {
                console.log(`👌  <<< The following unused dependencies have been found: ${JSON.stringify(dependencies, null, 2)}`);
            } else {
                console.log('👌  <<< No unused dependencies have been found.');
            }
            resolve(dependencies);
        });
    })
}

module.exports = { versionInfo, collectUnusedDependencies };
