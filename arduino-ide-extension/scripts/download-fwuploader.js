// @ts-check

(async () => {
  const fs = require('fs');
  const path = require('path');
  const temp = require('temp');
  const shell = require('shelljs');
  const semver = require('semver');
  const downloader = require('./downloader');

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
    // We assume an object with `owner`, `repo`, commitish?` properties.
    const { owner, repo, commitish } = version;
    if (!owner) {
      shell.echo(`Could not retrieve 'owner' from ${JSON.stringify(version)}`);
      shell.exit(1);
    }
    if (!repo) {
      shell.echo(`Could not retrieve 'repo' from ${JSON.stringify(version)}`);
      shell.exit(1);
    }
    const url = `https://github.com/${owner}/${repo}.git`;
    shell.echo(
      `Building Firmware Uploader from ${url}. Commitish: ${
        commitish ? commitish : 'HEAD'
      }`
    );

    if (fs.existsSync(destinationPath)) {
      shell.echo(
        `Skipping the Firmware Uploader build because it already exists: ${destinationPath}`
      );
      return;
    }

    if (shell.mkdir('-p', buildFolder).code !== 0) {
      shell.echo('Could not create build folder.');
      shell.exit(1);
    }

    const tempRepoPath = temp.mkdirSync();
    shell.echo(`>>> Cloning Firmware Uploader source to ${tempRepoPath}...`);
    if (shell.exec(`git clone ${url} ${tempRepoPath}`).code !== 0) {
      shell.exit(1);
    }
    shell.echo('<<< Cloned Firmware Uploader repo.');

    if (commitish) {
      shell.echo(`>>> Checking out ${commitish}...`);
      if (
        shell.exec(`git -C ${tempRepoPath} checkout ${commitish}`).code !== 0
      ) {
        shell.exit(1);
      }
      shell.echo(`<<< Checked out ${commitish}.`);
    }

    shell.echo(`>>> Building the Firmware Uploader...`);
    if (shell.exec('go build', { cwd: tempRepoPath }).code !== 0) {
      shell.exit(1);
    }
    shell.echo('<<< Firmware Uploader build done.');

    if (!fs.existsSync(path.join(tempRepoPath, fwuploderName))) {
      shell.echo(
        `Could not find the Firmware Uploader at ${path.join(
          tempRepoPath,
          fwuploderName
        )}.`
      );
      shell.exit(1);
    }

    const builtFwUploaderPath = path.join(tempRepoPath, fwuploderName);
    shell.echo(
      `>>> Copying Firmware Uploader from ${builtFwUploaderPath} to ${destinationPath}...`
    );
    if (shell.cp(builtFwUploaderPath, destinationPath).code !== 0) {
      shell.exit(1);
    }
    shell.echo(`<<< Copied the Firmware Uploader.`);

    shell.echo('<<< Verifying Firmware Uploader...');
    if (!fs.existsSync(destinationPath)) {
      shell.exit(1);
    }
    shell.echo('>>> Verified Firmware Uploader.');
  }
})();
