// @ts-check

(async () => {
  const path = require('node:path');
  const shell = require('shelljs');
  const semver = require('semver');
  const downloader = require('./downloader');
  const { taskBuildFromGit } = require('./utils');

  const version = (() => {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    if (!pkg) {
      return undefined;
    }

    const { arduino } = pkg;
    if (!arduino) {
      return undefined;
    }

    const { fwuploader } = arduino;
    if (!fwuploader) {
      return undefined;
    }

    const { version } = fwuploader;
    return version;
  })();

  if (!version) {
    shell.echo(
      `Could not retrieve Firmware Uploader version info from the 'package.json'.`
    );
    shell.exit(1);
  }

  const { platform, arch } = process;
  const buildFolder = path.join(__dirname, '..', 'build');
  const fwuploderName = `arduino-fwuploader${
    platform === 'win32' ? '.exe' : ''
  }`;
  const destinationPath = path.join(buildFolder, fwuploderName);

  if (typeof version === 'string') {
    const suffix = (() => {
      switch (platform) {
        case 'darwin':
          return 'macOS_64bit.tar.gz';
        case 'win32':
          return 'Windows_64bit.zip';
        case 'linux': {
          switch (arch) {
            case 'arm':
              return 'Linux_ARMv7.tar.gz';
            case 'arm64':
              return 'Linux_ARM64.tar.gz';
            case 'x64':
              return 'Linux_64bit.tar.gz';
            default:
              return undefined;
          }
        }
        default:
          return undefined;
      }
    })();
    if (!suffix) {
      shell.echo(
        `The Firmware Uploader is not available for ${platform} ${arch}.`
      );
      shell.exit(1);
    }
    if (semver.valid(version)) {
      const url = `https://downloads.arduino.cc/arduino-fwuploader/arduino-fwuploader_${version}_${suffix}`;
      shell.echo(
        `📦  Identified released version of the Firmware Uploader. Downloading version ${version} from '${url}'`
      );
      await downloader.downloadUnzipFile(
        url,
        destinationPath,
        'arduino-fwuploader'
      );
    } else {
      shell.echo(`🔥  Could not interpret 'version': ${version}`);
      shell.exit(1);
    }
  } else {
    taskBuildFromGit(version, destinationPath, 'Firmware Uploader');
  }
})();
