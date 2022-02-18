const fs = require('fs');
const isCI = require('is-ci');
const { notarize } = require('electron-notarize');
const utils = require('../../packager/utils');
const { getChannelFile } = utils;
const join = require('path').join;
const { hashFile } = require('./hash');

exports.default = async function notarizing(context) {
  if (!isCI) {
    console.log('Skipping notarization: not on CI.');
    return;
  }
  if (process.env.IS_FORK === 'true') {
    console.log('Skipping the app notarization: building from a fork.');
    return;
  }
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = context.packager.config.appId;
  console.log(
    `>>> Notarizing ${appBundleId} at ${appOutDir}/${appName}.app...`
  );

  await notarize({
    appBundleId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.AC_USERNAME,
    appleIdPassword: process.env.AC_PASSWORD,
  });
  return await recalculateHash();
};

async function recalculateHash() {
  const { platform } = process;
  const cwd = join(__dirname, '..', 'build', 'dist');
  const channelFilePath = join(cwd, getChannelFile(platform));
  const yaml = require('yaml');

  try {
    let fileContents = fs.readFileSync(channelFilePath, 'utf8');
    const newChannelFile = yaml.parse(fileContents);
    const { files, path } = newChannelFile;
    const newSha512 = await hashFile(join(cwd, path));
    newChannelFile.sha512 = newSha512;
    if (!!files) {
      const newFiles = [];
      for (let file of files) {
        const { url } = file;
        const { size } = fs.statSync(join(cwd, url));
        const newSha512 = await hashFile(join(cwd, url));
        newFiles.push({ ...file, sha512: newSha512, size });
      }
      newChannelFile.files = newFiles;
    }
    console.log(channelFilePath);
    fs.writeFileSync(channelFilePath, yaml.stringify(newChannelFile));
  } catch (e) {
    console.log(e);
  }
}
