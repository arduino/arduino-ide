//@ts-check

const fs = require('fs');
const zip = require('7zip-min');
const temp = require('temp');
const path = require('path');
const shell = require('shelljs');
const depcheck = require('depcheck');
const fromFile = require('file-type').fromFile;

/**
 * Resolves to an array of `npm` package names that are declared in the `package.json` but **not** used by the project.
 */
function collectUnusedDependencies(pathToProject = process.cwd()) {
  const p = path.isAbsolute(pathToProject)
    ? pathToProject
    : path.resolve(process.cwd(), pathToProject);
  console.log(`⏱️  >>> Collecting unused backend dependencies for ${p}...`);
  return new Promise((resolve) => {
    depcheck(
      p,
      {
        ignoreDirs: ['frontend'],
        parsers: {
          '*.js': depcheck.parser.es6,
          '*.jsx': depcheck.parser.jsx,
        },
        detectors: [
          depcheck.detector.requireCallExpression,
          depcheck.detector.importDeclaration,
        ],
        specials: [depcheck.special.eslint, depcheck.special.webpack],
      },
      (unused) => {
        const { dependencies } = unused;
        if (dependencies && dependencies.length > 0) {
          console.log(
            `👌  <<< The following unused dependencies have been found: ${JSON.stringify(
              dependencies,
              null,
              2
            )}`
          );
        } else {
          console.log('👌  <<< No unused dependencies have been found.');
        }
        resolve(dependencies);
      }
    );
  });
}

/**
 * Returns the `basename` of `pathToFile` without the file extension.
 */
function basename(pathToFile) {
  const name = path.basename(pathToFile);
  const ext = path.extname(pathToFile);
  return name.substr(0, name.length - ext.length);
}

function unpack(what, where) {
  return new Promise((resolve, reject) => {
    zip.unpack(what, where, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function pack(what, where) {
  return new Promise((resolve, reject) => {
    zip.pack(what, where, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function list(what) {
  return new Promise((resolve, reject) => {
    zip.list(what, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result.map(({ name }) => name));
    });
  });
}

async function isZip(pathToFile) {
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`${pathToFile} does not exist`);
  }
  const type = await fromFile(pathToFile);
  return type && type.ext === 'zip';
}

const isElectronPublish = false; // TODO: support auto-updates
const isNightly = process.env.IS_NIGHTLY === 'true';
const isRelease = process.env.IS_RELEASE === 'true';

function git(command) {
  try {
    const gitPath = shell.which('git');
    const error = shell.error();
    if (error) {
      throw new Error(error);
    }
    const { stderr, stdout } = shell.exec(`"${gitPath}" ${command}`, {
      silent: true,
    });
    if (stderr) {
      throw new Error(stderr.toString().trim());
    }
    return stdout.toString().trim();
  } catch (e) {
    throw e;
  }
}

// getChannelFile returns the name of the channel file to be released
// together with the IDE file.
// The channel file depends on the platform and whether we're creating
// a nightly build or a full release.
// In all other cases, like when building a tester build for a PR,
// an empty string is returned since we don't need a channel file.
// The channel files are necessary for updates check with electron-updater
// to work correctly.
// For more information: https://www.electron.build/auto-update
function getChannelFile(platform) {
  let currentChannel = 'beta';
  if (isRelease) {
    currentChannel = 'latest';
  }
  return (
    currentChannel +
    {
      linux: '-linux.yml',
      win32: '.yml',
      darwin: '-mac.yml',
    }[platform]
  );
}

module.exports = {
  collectUnusedDependencies,
  isZip,
  unpack,
  isNightly,
  isRelease,
  isElectronPublish,
  git,
  getChannelFile,
};
