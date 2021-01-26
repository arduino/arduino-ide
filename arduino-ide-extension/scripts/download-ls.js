// @ts-check
// The links to the downloads as of today (28.08.2019) are the following:
// - https://downloads.arduino.cc/arduino-language-server/nightly/arduino-language-server_${SUFFIX}
// - https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${VERSION}_${SUFFIX}

(() => {

    const DEFAULT_ALS_VERSION = 'nightly';
    const DEFAULT_CLANGD_VERSION = 'snapshot_20210124';

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
            choices: ['snapshot_20210124'],
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
    const lsExecutablePath = path.join(build, `arduino-language-server${platform === 'win32' ? '.exe' : ''}`);

    let clangdExecutablePath, lsSuffix, clangdPrefix;
    switch (platform) {
        case 'darwin':
            clangdExecutablePath = path.join(build, 'bin', 'clangd')
            lsSuffix = 'macOS_amd64.zip';
            clangdPrefix = 'mac';
            break;
        case 'linux':
            clangdExecutablePath = path.join(build, 'bin', 'clangd')
            lsSuffix = 'Linux_amd64.zip';
            clangdPrefix = 'linux'
            break;
        case 'win32':
            clangdExecutablePath = path.join(build, 'bin', 'clangd.exe')
            lsSuffix = 'Windows_amd64.zip';
            clangdPrefix = 'windows';
            break;
    }
    if (!lsSuffix) {
        shell.echo(`The arduino-language-server is not available for ${platform} ${arch}.`);
        shell.exit(1);
    }

    const alsUrl = `https://downloads.arduino.cc/arduino-language-server/${alsVersion === 'nightly' ? 'nightly/arduino-language-server' : 'arduino-language-server_' + alsVersion}_${lsSuffix}`;
    downloader.downloadUnzipAll(alsUrl, build, lsExecutablePath, force);

    const clangdUrl = `https://downloads.arduino.cc/arduino-language-server/clangd/clangd-${clangdPrefix}-${clangdVersion}.zip`;
    downloader.downloadUnzipAll(clangdUrl, build, clangdExecutablePath, force, { strip: 1 }); // `strip`: the new clangd (12.x) is zipped into a folder, so we have to strip the outmost folder.

})();
