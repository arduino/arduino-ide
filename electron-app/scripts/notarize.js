// @ts-check
'use strict';

const isCI = require('is-ci');
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  if (!isCI) {
    console.log('Skipping notarization: not on CI');
    return;
  }
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: not on macOS');
    return;
  }
  if (process.env.CAN_SIGN !== 'true') {
    console.log('Skipping the app notarization: certificate was not provided');
    return;
  }

  if (!process.env.AC_USERNAME) {
    throw new Error('AC_USERNAME must be set when notarizing on macOS');
  }
  if (!process.env.AC_PASSWORD) {
    throw new Error('AC_PASSWORD must be set when notarizing on macOS');
  }
  if (!process.env.AC_TEAM_ID) {
    throw new Error('AC_TEAM_ID must be set when notarizing on macOS');
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
    teamId: process.env.AC_TEAM_ID,
    tool: 'notarytool',
  });
};
