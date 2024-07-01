const childProcess = require('child_process');

exports.default = async function (configuration) {
  const SIGNTOOL_PATH = process.env.SIGNTOOL_PATH;
  const INSTALLER_CERT_WINDOWS_CER = process.env.INSTALLER_CERT_WINDOWS_CER;
  const CERT_PASSWORD = process.env.CERT_PASSWORD;
  const CONTAINER_NAME = process.env.CONTAINER_NAME;
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
    console.warn(
      'Custom windows signing was no performed: SIGNTOOL_PATH, INSTALLER_CERT_WINDOWS_CER, CERT_PASSWORD, and CONTAINER_NAME environment variables were not provided.'
    );
    process.exit(1);
  }
};
