// @ts-check
// The links to the downloads as of today (28.08.2019) are the following:
// - https://downloads.arduino.cc/arduino-language-server/nightly/arduino-language-server_${SUFFIX}
// - https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${VERSION}_${SUFFIX}

(() => {

    const DEFAULT_ALS_VERSION = 'nightly';
    const DEFAULT_CLANGD_VERSION = '8.0.1';

    const os = require('os');
    const path = require('path');
    const shell = require('shelljs');
    const downloader = require('./downloader');

    const yargs = require('yargs')
        .option('ls-version', {
            alias: 'lv',
            default: DEFAULT_ALS_VERSION,
            choices: ['nightly'],
            describe: `The version of the 'arduino-language-server' to download. Defaults to ${DEFAULT_ALS_VERSION}.`
        })
        .option('clangd-version', {
            alias: 'cv',
            default: DEFAULT_CLANGD_VERSION,
            choices: ['8.0.1'],
            describe: `The version of 'clangd' to download. Defaults to ${DEFAULT_CLANGD_VERSION}.`
        })
        .option('force-download', {
            alias: 'fd',
            default: false,
            describe: `If set, this script force downloads the 'arduino-language-server' even if it already exists on the file system.`
        })
        .version(false).parse();

    const alsVersion = yargs['ls-version'];
    const clangdVersion = yargs['clangd-version']
    const force = yargs['force-download'];
    const { platform, arch } = process;

    const build = path.join(__dirname, '..', 'build');
    const als = path.join(build, `arduino-language-server${os.platform() === 'win32' ? '.exe' : ''}`);
    const clangd = path.join(build, `clangd${os.platform() === 'win32' ? '.exe' : ''}`);

    let alsSuffix, clangdSuffix;
    switch (platform) {
        case 'darwin':
            alsSuffix = 'Darwin_amd64.zip';
            clangdSuffix = 'macos.zip';
            break;
        case 'win32':
            alsSuffix = 'Windows_NT_amd64.zip';
            clangdSuffix = 'windows.zip';
            break;
        case 'linux':
            alsSuffix = 'Linux_amd64.zip';
            break;
    }
    if (!alsSuffix) {
        shell.echo(`The arduino-language-server is not available for ${platform} ${arch}.`);
        shell.exit(1);
    }

    const alsUrl = `https://downloads.arduino.cc/arduino-language-server/${alsVersion === 'nightly' ? 'nightly/arduino-language-server' : 'arduino-language-server_' + alsVersion}_${alsSuffix}`;
    downloader.download(alsUrl, als, 'arduino-language-server', force);

    if (clangdSuffix) {
        const clangdUrl = `https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${clangdVersion}_${clangdSuffix}`;
        downloader.download(clangdUrl, clangd, 'clangd', force);
    }

})();