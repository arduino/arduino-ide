const childProcess = require('child_process');

exports.default = async function (configuration) {
  if (!process.env.GITHUB_ACTIONS || process.env.CAN_SIGN !== 'true') {
    return;
  }

  const SIGNTOOL_PATH = process.env.SIGNTOOL_PATH;
  const INSTALLER_CERT_WINDOWS_CER = process.env.INSTALLER_CERT_WINDOWS_CER;
  const CERT_PASSWORD = process.env.WIN_CERT_PASSWORD;
  const CONTAINER_NAME = process.env.WIN_CERT_CONTAINER_NAME;
  const filePath = configuration.path;

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
    const missing = Object.entries({
      SIGNTOOL_PATH,
      INSTALLER_CERT_WINDOWS_CER,
      WIN_CERT_PASSWORD: CERT_PASSWORD,
      WIN_CERT_CONTAINER_NAME: CONTAINER_NAME,
    })
      .filter(([, value]) => !value)
      .map(([name]) => name)
      .join(', ');
    console.warn(
      `Custom windows signing was not performed, missing variables: ${missing}`
    );
    process.exit(1);
  }
};
