// @ts-check
'use strict';

const isCI = require('is-ci');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { isRelease } = require('./utils');
const { isZip, adjustArchiveStructure } = require('./archive');

async function run() {
  if (isCI) {
    console.log(`🚢 Detected CI, recalculating artifacts hash...`);
    await recalculateArtifactsHash();
    console.log(`🚢 Detected CI, moving build artifacts...`);
    await copyFilesToBuildArtifacts();
    console.log('👌 Done.');
  }
}

async function recalculateArtifactsHash() {
  const { platform } = process;
  const cwd = path.join(__dirname, '..', 'dist');
  const channelFilePath = path.join(cwd, getChannelFile(platform));
  const yaml = require('yaml');

  try {
    let fileContents = fs.readFileSync(channelFilePath, 'utf8');
    const newChannelFile = yaml.parse(fileContents);
    const { files, path: filePath } = newChannelFile;
    const newSha512 = await hashFile(path.join(cwd, filePath));
    newChannelFile.sha512 = newSha512;
    if (!!files) {
      const newFiles = [];
      for (let file of files) {
        const { url } = file;
        const { size } = fs.statSync(path.join(cwd, url));
        const newSha512 = await hashFile(path.join(cwd, url));

        if (!newFiles.find((f) => f.sha512 === newSha512)) {
          newFiles.push({ ...file, sha512: newSha512, size });
        }
      }
      newChannelFile.files = newFiles;
    }

    const newChannelFileRaw = yaml.stringify(newChannelFile);
    fs.writeFileSync(channelFilePath, newChannelFileRaw);
    console.log(`👌  >>> Channel file updated successfully. New channel file:`);
    console.log(newChannelFileRaw);
  } catch (e) {
    console.log(e);
  }
}

/**
 * @param {import('node:fs').PathLike} file
 * @param {string|undefined} [algorithm="sha512"]
 * @param {BufferEncoding|undefined} [encoding="base64"]
 * @param {object|undefined} [options]
 */
function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
  const crypto = require('node:crypto');
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    hash.on('error', reject).setEncoding(encoding);
    fs.createReadStream(
      file,
      Object.assign({}, options, {
        highWaterMark: 1024 * 1024,
        /* better to use more memory but hash faster */
      })
    )
      .on('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(hash, {
        end: false,
      });
  });
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

async function copyFilesToBuildArtifacts() {
  const { platform } = process;
  const cwd = path.join(__dirname, '..', 'dist');
  const targetFolder = path.join(cwd, 'build-artifacts');
  await require('fs/promises').mkdir(targetFolder, { recursive: true });
  const filesToCopy = [];
  const channelFile = getChannelFile(platform);
  // Channel file might be an empty string if we're not building a
  // nightly or a full release. This can happen when building a package
  // locally or a tester build when creating a new PR on GH.
  if (!!channelFile && fs.existsSync(path.join(cwd, channelFile))) {
    const channelFilePath = path.join(cwd, channelFile);
    const newChannelFilePath = channelFilePath
      ?.replace('latest', 'stable')
      ?.replace('beta', 'nightly');
    console.log(
      `🔨  >>> Renaming ${channelFilePath} to ${newChannelFilePath}.`
    );
    await cpf(channelFilePath, newChannelFilePath);
    filesToCopy.push(newChannelFilePath);
  }
  switch (platform) {
    case 'linux': {
      filesToCopy.push(
        ...glob
          .sync('**/arduino-ide*.{zip,AppImage}', { cwd })
          .map((p) => path.join(cwd, p))
      );
      break;
    }
    case 'win32': {
      filesToCopy.push(
        ...glob
          .sync('**/arduino-ide*.{exe,msi,zip}', { cwd })
          .map((p) => path.join(cwd, p))
      );
      break;
    }
    case 'darwin': {
      filesToCopy.push(
        ...glob
          .sync('**/arduino-ide*.{dmg,zip}', { cwd })
          .map((p) => path.join(cwd, p))
      );
      break;
    }
    default: {
      console.error(`Unsupported platform: ${platform}.`);
      process.exit(1);
    }
  }
  if (!filesToCopy.length) {
    console.error(`Could not collect any build artifacts from ${cwd}.`);
    process.exit(1);
  }
  for (const fileToCopy of filesToCopy) {
    if (platform === 'linux' && (await isZip(fileToCopy))) {
      await adjustArchiveStructure(fileToCopy, targetFolder);
    } else {
      const filename = path.basename(fileToCopy);
      await cpf(fileToCopy, path.join(targetFolder, filename));
    }
  }
}

/**
 * `cp -f`: copies a file into a target location. Always overrides.
 * @param {string} sourceFilePath absolute path to file you want to copy
 * @param {string} targetFilePath target location where you want to copy
 */
async function cpf(sourceFilePath, targetFilePath) {
  const fs = require('fs/promises');
  console.log(`🚢  >>> Copying ${sourceFilePath} to ${targetFilePath}.`);
  await fs.copyFile(sourceFilePath, targetFilePath);
  console.log(`👌  >>> Copied ${sourceFilePath} to ${targetFilePath}.`);
}

run();
