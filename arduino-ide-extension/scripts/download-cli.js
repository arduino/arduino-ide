// @ts-check
// The links to the downloads as of today (11.08.) are the followings:
// - https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli-nightly-latest-${FILE_NAME}
// - https://downloads.arduino.cc/arduino-cli/arduino-cli-latest-${FILE_NAME}

(async () => {

    const DEFAULT_VERSION = 'nightly';

    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    const shell = require('shelljs');
    const download = require('download');
    const decompress = require('decompress');
    const unzip = require('decompress-unzip');
    const untarbz = require('decompress-tarbz2');

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
            choices: [
                // 'latest', // TODO: How do we get the source for `latest`. Currently, `latest` is the `0.3.7-alpha.preview`.
                'nightly'
            ],
            describe: `The version of the 'arduino-cli' to download. Defaults to ${DEFAULT_VERSION}.`
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
            case 'darwin': return 'macosx.zip';
            case 'win32': return 'windows.zip';
            case 'linux': {
                switch (arch) {
                    case 'arm64': return 'linuxarm.tar.bz2';
                    case 'x32': return 'linux32.tar.bz2';
                    case 'x64': return 'linux64.tar.bz2';
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

    const url = `https://downloads.arduino.cc/arduino-cli/${version === 'nightly' ? 'nightly/' : ''}arduino-cli-${version}-latest-${suffix}`;
    shell.echo(`>>> Downloading 'arduino-cli' from '${url}'...`);
    const data = await download(url);
    shell.echo(`<<< Download succeeded.`);
    shell.echo('>>> Decompressing CLI...');
    const files = await decompress(data, downloads, {
        plugins: [
            unzip(),
            untarbz()
        ]
    });
    shell.echo('<<< Decompressing succeeded.');

    if (files.length !== 1) {
        shell.echo('Error ocurred when decompressing the CLI.');
        shell.exit(1);
    }
    if (shell.mv('-f', path.join(downloads, files[0].path), cli).code !== 0) {
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