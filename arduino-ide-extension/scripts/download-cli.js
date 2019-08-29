// @ts-check
// The links to the downloads as of today (19.08.) are the followings:
// In order to get the latest nightly build for your platform use the following links replacing <DATE> with the current date, using the format YYYYMMDD (i.e for 2019/Aug/06 use 20190806 )
// Linux 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Linux_64bit.tar.gz
// Linux ARM 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Linux_ARM64.tar.gz
// Windows 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Windows_64bit.zip
// Mac OSX: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_macOS_64bit.tar.gz

(async () => {

    const DEFAULT_VERSION = require('moment')().format('YYYYMMDD');

    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    const shell = require('shelljs');
    const download = require('download');
    const decompress = require('decompress');
    const unzip = require('decompress-unzip');
    const untargz = require('decompress-targz');

    process.on('unhandledRejection', (reason, _) => {
        shell.echo(String(reason));
        shell.exit(1);
        throw reason;
    });
    process.on('uncaughtException', error => {
        shell.echo(String(error));
        shell.exit(1);
        throw error;
    });

    const yargs = require('yargs')
        .option('cli-version', {
            alias: 'cv',
            default: DEFAULT_VERSION,
            describe: `The version of the 'arduino-cli' to download with the YYYYMMDD format. Defaults to ${DEFAULT_VERSION}.`
        })
        .option('force-download', {
            alias: 'fd',
            default: false,
            describe: `If set, this script force downloads the 'arduino-cli' even if it already exists on the file system.`
        })
        .version(false).parse();

    const version = yargs['cli-version'];
    const force = yargs['force-download'];
    const { platform, arch } = process;

    const build = path.join(__dirname, '..', 'build');
    const downloads = path.join(__dirname, '..', 'downloads');
    const cli = path.join(build, `arduino-cli${os.platform() === 'win32' ? '.exe' : ''}`);

    if (fs.existsSync(cli) && !force) {
        shell.echo(`The 'arduino-cli' already exists at ${cli}. Skipping download.`);
        shell.exit(0);
    }
    if (!fs.existsSync(build)) {
        if (shell.mkdir('-p', build).code !== 0) {
            shell.echo('Could not create new directory.');
            shell.exit(1);
        }
    }
    if (shell.rm('-rf', cli, downloads).code !== 0) {
        shell.exit(1);
    }

    const suffix = (() => {
        switch (platform) {
            case 'darwin': return 'macOS_64bit.tar.gz';
            case 'win32': return 'Windows_64bit.zip';
            case 'linux': {
                switch (arch) {
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

    const url = `https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-${version}_${suffix}`;
    shell.echo(`>>> Downloading 'arduino-cli' from '${url}'...`);
    const data = await download(url);
    shell.echo(`<<< Download succeeded.`);
    shell.echo('>>> Decompressing CLI...');
    const files = await decompress(data, downloads, {
        plugins: [
            unzip(),
            untargz()
        ]
    });
    if (files.length === 0) {
        shell.echo('Error ocurred when decompressing the CLI.');
        shell.exit(1);
    }
    const cliIndex = files.findIndex(f => f.path.startsWith('arduino-cli'));
    if (cliIndex === -1) {
        shell.echo('The downloaded artifact does not contains the CLI.');
        shell.exit(1);
    }
    shell.echo('<<< Decompressing succeeded.');

    if (shell.mv('-f', path.join(downloads, files[cliIndex].path), cli).code !== 0) {
        shell.echo(`Could not move file to ${cli}.`);
        shell.exit(1);
    }
    if (!fs.existsSync(cli)) {
        shell.echo(`Could not find CLI at ${cli}.`);
        shell.exit(1);
    } else {
        shell.echo('Done.');
    }

})();