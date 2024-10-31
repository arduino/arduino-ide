const childProcess = require('child_process');

exports.default = async function (configuration) {
  if (!process.env.GITHUB_ACTIONS) {
    return;
  }

  const SIGNTOOL_PATH = process.env.SIGNTOOL_PATH;
  const INSTALLER_CERT_WINDOWS_CER = process.env.INSTALLER_CERT_WINDOWS_CER;
  const CERT_PASSWORD = process.env.WIN_CERT_PASSWORD;
  const CONTAINER_NAME = process.env.WIN_CERT_CONTAINER_NAME;
  const filePath = configuration.path;

  const test = process.env.GH_TEST_SECRET;

  console.warn('test secret', test);

  if (
    SIGNTOOL_PATH &&
    INSTALLER_CERT_WINDOWS_CER &&
    CERT_PASSWORD &&
    CONTAINER_NAME
  ) {
    childProcess.execSync(
      `"${SIGNTOOL_PATH}" sign -d "Arduino IDE" -f "${INSTALLER_CERT_WINDOWS_CER}" -csp "eToken Base Cryptographic Provider" -k "[{{${CERT_PASSWORD}}}]=${CONTAINER_NAME}" -fd sha256 -tr http://timestamp.digicert.com -td SHA256 -v "${filePath}"`,
      { stdio: 'inherit' }
    );
  } else {
    console.warn(
      `Custom windows signing was no performed one of the following variables was not provided: SIGNTOOL_PATH (${SIGNTOOL_PATH}), INSTALLER_CERT_WINDOWS_CERT (${INSTALLER_CERT_WINDOWS_CER}), CERT_PASSWORD (${CERT_PASSWORD}), CONTAINER_NAME (${CONTAINER_NAME})`
    );
    process.exit(1);
  }
};
