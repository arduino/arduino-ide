//@ts-check

const fs = require('fs');
const zip = require('7zip-min');
const temp = require('temp');
const path = require('path');
const shell = require('shelljs');
const fromFile = require('file-type').fromFile;

/**
 * `pathToZip` is a `path/to/your/app-name.zip`.
 * If the `pathToZip` archive does not have a root directory with name `app-name`, it creates one, and move the content from the
 * archive's root to the new root folder. If the archive already has the desired root folder, calling this function is a NOOP.
 * If `pathToZip` is not a ZIP, rejects. `targetFolderName` is the destination folder not the new archive location.
 */
function adjustArchiveStructure(pathToZip, targetFolderName, noCleanup) {
  return new Promise(async (resolve, reject) => {
    if (!(await isZip(pathToZip))) {
      reject(new Error(`Expected a ZIP file.`));
      return;
    }
    if (!fs.existsSync(targetFolderName)) {
      reject(new Error(`${targetFolderName} does not exist.`));
      return;
    }
    if (!fs.lstatSync(targetFolderName).isDirectory()) {
      reject(new Error(`${targetFolderName} is not a directory.`));
      return;
    }
    console.log(`⏱️  >>> Adjusting ZIP structure ${pathToZip}...`);

    const root = basename(pathToZip);
    const resources = await list(pathToZip);
    const hasBaseFolder = resources.find((name) => name === root);
    if (hasBaseFolder) {
      if (
        resources.filter((name) => name.indexOf(path.sep) === -1).length > 1
      ) {
        console.warn(
          `${pathToZip} ZIP has the desired root folder ${root}, however the ZIP contains other entries too: ${JSON.stringify(
            resources
          )}`
        );
      }
      console.log(`👌  <<< The ZIP already has the desired ${root} folder.`);
      resolve(pathToZip);
      return;
    }

    const track = temp.track();
    try {
      const unzipOut = path.join(track.mkdirSync(), root);
      fs.mkdirSync(unzipOut);
      await unpack(pathToZip, unzipOut);
      const adjustedZip = path.join(targetFolderName, path.basename(pathToZip));
      await pack(unzipOut, adjustedZip);
      console.log(
        `👌  <<< Adjusted the ZIP structure. Moved the modified ${basename(
          pathToZip
        )} to the ${targetFolderName} folder.`
      );
      resolve(adjustedZip);
    } finally {
      if (!noCleanup) {
        track.cleanupSync();
      }
    }
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
      resolve(undefined);
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
      resolve(undefined);
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

/**
 * @param {readonly string[]} args
 */
async function git(args) {
  try {
    const git = shell.which('git');
    const error = shell.error();
    if (error) {
      throw new Error(error);
    }
    if (!git) {
      throw new Error("Could not find 'git' on the $PATH");
    }
    const stdout = await exec(git.toString(), args);
    return stdout;
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

/**
 * @param {string} command
 * @param {readonly string[]} args
 */
async function exec(command, args) {
  const execa = await import('execa');
  const promise = execa.execa(command, args);
  if (promise.pipeStdout) {
    promise.pipeStdout(process.stdout);
  }
  const { stdout } = await promise;
  return stdout;
}

module.exports = {
  adjustArchiveStructure,
  isZip,
  unpack,
  isNightly,
  isRelease,
  isElectronPublish,
  git,
  getChannelFile,
  exec,
};
