// @ts-check
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zip = require('7zip-min');
const temp = require('temp');

/**
 * `pathToZip` is a `path/to/your/app-name.zip`.
 * If the `pathToZip` archive does not have a root directory with name `app-name`, it creates one, and move the content from the
 * archive's root to the new root folder. If the archive already has the desired root folder, calling this function is a NOOP.
 * If `pathToZip` is not a ZIP, rejects. `targetFolder` is the destination folder not the new archive location.
 *
 * @param {string} pathToZip path to the archive to adjust
 * @param {string} targetFolder the adjusted archive will be here
 * @param {boolean} [noCleanup=false] for testing
 */
function adjustArchiveStructure(pathToZip, targetFolder, noCleanup = false) {
  return new Promise(async (resolve, reject) => {
    if (!(await isZip(pathToZip))) {
      reject(new Error(`Expected a ZIP file.`));
      return;
    }
    if (!fs.existsSync(targetFolder)) {
      reject(new Error(`${targetFolder} does not exist.`));
      return;
    }
    if (!fs.lstatSync(targetFolder).isDirectory()) {
      reject(new Error(`${targetFolder} is not a directory.`));
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
      const adjustedZip = path.join(targetFolder, path.basename(pathToZip));
      await pack(unzipOut, adjustedZip);
      console.log(
        `👌  <<< Adjusted the ZIP structure. Moved the modified ${basename(
          pathToZip
        )} to the ${targetFolder} folder.`
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

/**
 * @param {string} what path to the archive
 * @param {string} where path to the destination
 */
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

/**
 * @param {string} pathToFile
 */
async function isZip(pathToFile) {
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`${pathToFile} does not exist`);
  }
  const fileType = await import('file-type');
  const type = await fileType.fileTypeFromFile(pathToFile);
  return type && type.ext === 'zip';
}

module.exports = { isZip, unpack, adjustArchiveStructure };
