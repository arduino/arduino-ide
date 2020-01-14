// @ts-check
// The links to the downloads as of today (28.08.2019) are the following:
// - https://downloads.arduino.cc/arduino-language-server/nightly/arduino-language-server_${SUFFIX}
// - https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${VERSION}_${SUFFIX}

(() => {

    const DEFAULT_ALS_VERSION = 'nightly';
    const DEFAULT_CLANGD_VERSION = '9.0.0';

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
            choices: ['8.0.1', '9.0.0'],
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
    const alsTarget = path.join(build, `arduino-language-server${platform === 'win32' ? '.exe' : ''}`);

    let clangdTarget, alsSuffix, clangdSuffix;
    switch (platform) {
        case 'darwin':
            clangdTarget = path.join(build, 'bin', 'clangd')
            alsSuffix = 'Darwin_amd64.zip';
            clangdSuffix = 'macos.zip';
            break;
        case 'linux':
            clangdTarget = path.join(build, 'bin', 'clangd')
            alsSuffix = 'Linux_amd64.zip';
            clangdSuffix = 'linux.zip'
            break;
        case 'win32':
            clangdTarget = path.join(build, 'clangd.exe')
            alsSuffix = 'Windows_NT_amd64.zip';
            clangdSuffix = 'windows.zip';
            break;
    }
    if (!alsSuffix) {
        shell.echo(`The arduino-language-server is not available for ${platform} ${arch}.`);
        shell.exit(1);
    }

    const alsUrl = `https://downloads.arduino.cc/arduino-language-server/${alsVersion === 'nightly' ? 'nightly/arduino-language-server' : 'arduino-language-server_' + alsVersion}_${alsSuffix}`;
    downloader.downloadUnzipAll(alsUrl, build, alsTarget, force);

    const clangdUrl = `https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${clangdVersion}_${clangdSuffix}`;
    downloader.downloadUnzipAll(clangdUrl, build, clangdTarget, force);

})();
