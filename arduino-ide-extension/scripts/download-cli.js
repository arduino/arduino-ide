// @ts-check

(async () => {
  const path = require('path');
  const shell = require('shelljs');
  const semver = require('semver');
  const moment = require('moment');
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

    const { cli } = arduino;
    if (!cli) {
      return undefined;
    }

    const { version } = cli;
    return version;
  })();

  if (!version) {
    shell.echo(`Could not retrieve CLI version info from the 'package.json'.`);
    shell.exit(1);
  }

  const { platform, arch } = process;
  const buildFolder = path.join(__dirname, '..', 'build');
  const cliName = `arduino-cli${platform === 'win32' ? '.exe' : ''}`;
  const destinationPath = path.join(buildFolder, cliName);

  if (typeof version === 'string') {
    const suffix = (() => {
      switch (platform) {
        case 'darwin':
          if (arch === 'arm64') {
            return 'macOS_ARM64.tar.gz';
          }
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
      shell.echo(`The CLI is not available for ${platform} ${arch}.`);
      shell.exit(1);
    }
    if (semver.valid(version)) {
      const url = `https://downloads.arduino.cc/arduino-cli/arduino-cli_${version}_${suffix}`;
      shell.echo(
        `📦  Identified released version of the CLI. Downloading version ${version} from '${url}'`
      );
      await downloader.downloadUnzipFile(url, destinationPath, 'arduino-cli');
    } else if (moment(version, 'YYYYMMDD', true).isValid()) {
      const url = `https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-${version}_${suffix}`;
      shell.echo(
        `🌙  Identified nightly version of the CLI. Downloading version ${version} from '${url}'`
      );
      await downloader.downloadUnzipFile(url, destinationPath, 'arduino-cli');
    } else {
      shell.echo(`🔥  Could not interpret 'version': ${version}`);
      shell.exit(1);
    }
  } else {
    taskBuildFromGit(version, destinationPath, 'CLI');
  }
})();
