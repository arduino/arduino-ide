const isCI = require('is-ci');
const { notarize } = require('electron-notarize');

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
    console.log(`>>> Notarizing ${appBundleId} at ${appOutDir}/${appName}.app...`);

    return await notarize({
        appBundleId,
        appPath: `${appOutDir}/${appName}.app`,
        appleId: process.env.AC_USERNAME,
        appleIdPassword: process.env.AC_PASSWORD,
    });
};