const isCI = require('is-ci');
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  if (!isCI) {
    console.log('Skipping notarization: not on CI.');
    return;
  }
  if (process.env.CAN_SIGN === 'false') {
    console.log('Skipping the app notarization: certificate was not provided.');
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
    teamId: process.env.AC_TEAM_ID,
    tool: 'notarytool',
  });
};
