// @ts-check

(async () => {
  const path = require('node:path');
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

    const fwuploader = arduino['arduino-fwuploader'];
    if (!fwuploader) {
      return undefined;
    }

    const { version } = fwuploader;
    return version;
  })();

  if (!version) {
    console.log(
      `Could not retrieve Firmware Uploader version info from the 'package.json'.`
    );
    process.exit(1);
  }

  const { platform, arch } = process;
  const resourcesFolder = path.join(
    __dirname,
    '..',
    'src',
    'node',
    'resources'
  );
  const fwuploderName = `arduino-fwuploader${
    platform === 'win32' ? '.exe' : ''
  }`;
  const destinationPath = path.join(resourcesFolder, fwuploderName);

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
      console.log(
        `The Firmware Uploader is not available for ${platform} ${arch}.`
      );
      process.exit(1);
    }
    if (semver.valid(version)) {
      const url = `https://downloads.arduino.cc/arduino-fwuploader/arduino-fwuploader_${version}_${suffix}`;
      console.log(
        `📦  Identified released version of the Firmware Uploader. Downloading version ${version} from '${url}'`
      );
      await downloader.downloadUnzipFile(
        url,
        destinationPath,
        'arduino-fwuploader'
      );
    } else {
      console.log(`🔥  Could not interpret 'version': ${version}`);
      process.exit(1);
    }
  } else {
    taskBuildFromGit(version, destinationPath, 'Firmware Uploader');
  }
})();
