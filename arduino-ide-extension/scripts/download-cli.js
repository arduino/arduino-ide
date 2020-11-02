// @ts-check

(async () => {

    const fs = require('fs');
    const path = require('path');
    const temp = require('temp');
    const shell = require('shelljs');
    const semver = require('semver');
    const moment = require('moment');
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
                case 'darwin': return 'macOS_64bit.tar.gz';
                case 'win32': return 'Windows_64bit.zip';
                case 'linux': {
                    switch (arch) {
                        case 'arm': return 'Linux_ARMv7.tar.gz';
                        case 'arm64': return 'Linux_ARM64.tar.gz';
                        case 'x64': return 'Linux_64bit.tar.gz';
                        default: return undefined;
                    }
                }
                default: return undefined;
            }
        })();
        if (!suffix) {
            shell.echo(`The CLI is not available for ${platform} ${arch}.`);
            shell.exit(1);
        }
        if (semver.valid(version)) {
            const url = `https://downloads.arduino.cc/arduino-cli/arduino-cli_${version}_${suffix}`;
            shell.echo(`📦  Identified released version of the CLI. Downloading version ${version} from '${url}'`);
            await downloader.downloadUnzipFile(url, destinationPath, 'arduino-cli');
        } else if (moment(version, 'YYYYMMDD', true).isValid()) {
            const url = `https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-${version}_${suffix}`;
            shell.echo(`🌙  Identified nightly version of the CLI. Downloading version ${version} from '${url}'`);
            await downloader.downloadUnzipFile(url, destinationPath, 'arduino-cli');
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
        shell.echo(`Building CLI from ${url}. Commitish: ${commitish ? commitish : 'HEAD'}`);

        if (fs.existsSync(destinationPath)) {
            shell.echo(`Skipping the CLI build because it already exists: ${destinationPath}`);
            return;
        }

        if (shell.mkdir('-p', buildFolder).code !== 0) {
            shell.echo('Could not create build folder.');
            shell.exit(1);
        }

        const tempRepoPath = temp.mkdirSync();
        shell.echo(`>>> Cloning CLI source to ${tempRepoPath}...`);
        if (shell.exec(`git clone ${url} ${tempRepoPath}`).code !== 0) {
            shell.exit(1);
        }
        shell.echo('<<< Cloned CLI repo.')

        if (commitish) {
            shell.echo(`>>> Checking out ${commitish}...`);
            if (shell.exec(`git -C ${tempRepoPath} checkout ${commitish}`).code !== 0) {
                shell.exit(1);
            }
            shell.echo(`<<< Checked out ${commitish}.`);
        }

        shell.echo(`>>> Building the CLI...`);
        if (shell.exec('go build', { cwd: tempRepoPath }).code !== 0) {
            shell.exit(1);
        }
        shell.echo('<<< CLI build done.')

        if (!fs.existsSync(path.join(tempRepoPath, cliName))) {
            shell.echo(`Could not find the CLI at ${path.join(tempRepoPath, cliName)}.`);
            shell.exit(1);
        }

        const builtCliPath = path.join(tempRepoPath, cliName);
        shell.echo(`>>> Copying CLI from ${builtCliPath} to ${destinationPath}...`);
        if (shell.cp(builtCliPath, destinationPath).code !== 0) {
            shell.exit(1);
        }
        shell.echo(`<<< Copied the CLI.`);

        shell.echo('<<< Verifying CLI...');
        if (!fs.existsSync(destinationPath)) {
            shell.exit(1);
        }
        shell.echo('>>> Verified CLI.');

    }

})();
