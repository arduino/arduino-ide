// @ts-check
// The links to the downloads as of today (02.09.) are the followings:
// In order to get the latest nightly build for your platform use the following links replacing <DATE> with the current date, using the format YYYYMMDD (i.e for 2019/Aug/06 use 20190806 )
// Linux 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Linux_64bit.tar.gz
// Linux ARM 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Linux_ARM64.tar.gz
// Windows 64 bit: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_Windows_64bit.zip
// Mac OSX: https://downloads.arduino.cc/arduino-cli/nightly/arduino-cli_nightly-<DATE>_macOS_64bit.tar.gz
// [...]
// redirecting to latest generated builds by replacing latest with the latest available build date, using the format YYYYMMDD (i.e for 2019/Aug/06 latest is replaced with 20190806 

(() => {

    const DEFAULT_VERSION = '0.7.1'; // require('moment')().format('YYYYMMDD');

    const path = require('path');
    const shell = require('shelljs');
    const downloader = require('./downloader');

    const yargs = require('yargs')
        .option('cli-version', {
            alias: 'cv',
            default: DEFAULT_VERSION,
            describe: `The version of the 'arduino-cli' to download, or 'nightly-latest'. Defaults to ${DEFAULT_VERSION}.`
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
    const cli = path.join(build, `arduino-cli${platform === 'win32' ? '.exe' : ''}`);

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

    const url = `https://downloads.arduino.cc/arduino-cli${version.startsWith('nightly-') ? '/nightly' : ''}/arduino-cli_${version}_${suffix}`;
    downloader.downloadUnzipFile(url, cli, 'arduino-cli', force);

})();
