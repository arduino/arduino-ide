// @ts-check
// The links to the downloads as of today (28.08.2019) are the following:
// - https://downloads.arduino.cc/arduino-language-server/nightly/arduino-language-server_${SUFFIX}
// - https://downloads.arduino.cc/arduino-language-server/clangd/clangd_${VERSION}_${SUFFIX}

(() => {
  const path = require('path');
  const shell = require('shelljs');
  const downloader = require('./downloader');
  const { goBuildFromGit } = require('./utils');

  const [DEFAULT_LS_VERSION, DEFAULT_CLANGD_VERSION] = (() => {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    if (!pkg) return [undefined, undefined];

    const { arduino } = pkg;
    if (!arduino) return [undefined, undefined];

    const { languageServer, clangd } = arduino;
    if (!languageServer) return [undefined, undefined];
    if (!clangd) return [undefined, undefined];

    return [languageServer.version, clangd.version];
  })();

  if (!DEFAULT_LS_VERSION) {
    shell.echo(
      `Could not retrieve Arduino Language Server version info from the 'package.json'.`
    );
    shell.exit(1);
  }

  if (!DEFAULT_CLANGD_VERSION) {
    shell.echo(
      `Could not retrieve clangd version info from the 'package.json'.`
    );
    shell.exit(1);
  }

  const yargs = require('yargs')
    .option('ls-version', {
      alias: 'lv',
      default: DEFAULT_LS_VERSION,
      describe: `The version of the 'arduino-language-server' to download. Defaults to ${DEFAULT_LS_VERSION}.`,
    })
    .option('clangd-version', {
      alias: 'cv',
      default: DEFAULT_CLANGD_VERSION,
      choices: [DEFAULT_CLANGD_VERSION, 'snapshot_20210124'],
      describe: `The version of 'clangd' to download. Defaults to ${DEFAULT_CLANGD_VERSION}.`,
    })
    .option('force-download', {
      alias: 'fd',
      default: false,
      describe: `If set, this script force downloads the 'arduino-language-server' even if it already exists on the file system.`,
    })
    .version(false)
    .parse();

  const lsVersion = yargs['ls-version'];
  const clangdVersion = yargs['clangd-version'];
  const force = yargs['force-download'];
  const { platform, arch } = process;
  const platformArch = platform + '-' + arch;
  const build = path.join(__dirname, '..', 'build');
  const lsExecutablePath = path.join(
    build,
    `arduino-language-server${platform === 'win32' ? '.exe' : ''}`
  );
  let clangdExecutablePath, clangFormatExecutablePath, lsSuffix, clangdSuffix;

  switch (platformArch) {
    case 'darwin-x64':
      clangdExecutablePath = path.join(build, 'clangd');
      clangFormatExecutablePath = path.join(build, 'clang-format');
      lsSuffix = 'macOS_64bit.tar.gz';
      clangdSuffix = 'macOS_64bit';
      break;
    case 'darwin-arm64':
      clangdExecutablePath = path.join(build, 'clangd');
      clangFormatExecutablePath = path.join(build, 'clang-format');
      lsSuffix = 'macOS_ARM64.tar.gz';
      clangdSuffix = 'macOS_ARM64';
      break;
    case 'linux-x64':
      clangdExecutablePath = path.join(build, 'clangd');
      clangFormatExecutablePath = path.join(build, 'clang-format');
      lsSuffix = 'Linux_64bit.tar.gz';
      clangdSuffix = 'Linux_64bit';
      break;
    case 'linux-arm64':
      clangdExecutablePath = path.join(build, 'clangd');
      clangFormatExecutablePath = path.join(build, 'clang-format');
      lsSuffix = 'Linux_ARM64.tar.gz';
      clangdSuffix = 'Linux_ARM64';
      break;
    case 'win32-x64':
      clangdExecutablePath = path.join(build, 'clangd.exe');
      clangFormatExecutablePath = path.join(build, 'clang-format.exe');
      lsSuffix = 'Windows_64bit.zip';
      clangdSuffix = 'Windows_64bit';
      break;
    default:
      throw new Error(`Unsupported platform/arch: ${platformArch}.`);
  }
  if (!lsSuffix || !clangdSuffix) {
    shell.echo(
      `The arduino-language-server is not available for ${platform} ${arch}.`
    );
    shell.exit(1);
  }

  if (typeof lsVersion === 'string') {
    const lsUrl = `https://downloads.arduino.cc/arduino-language-server/${
      lsVersion === 'nightly'
        ? 'nightly/arduino-language-server'
        : 'arduino-language-server_' + lsVersion
    }_${lsSuffix}`;
    downloader.downloadUnzipAll(lsUrl, build, lsExecutablePath, force);
  } else {
    goBuildFromGit(lsVersion, lsExecutablePath, 'language-server');
  }

  const clangdUrl = `https://downloads.arduino.cc/tools/clangd_${clangdVersion}_${clangdSuffix}.tar.bz2`;
  downloader.downloadUnzipAll(clangdUrl, build, clangdExecutablePath, force, {
    strip: 1,
  }); // `strip`: the new clangd (12.x) is zipped into a folder, so we have to strip the outmost folder.

  const clangdFormatUrl = `https://downloads.arduino.cc/tools/clang-format_${clangdVersion}_${clangdSuffix}.tar.bz2`;
  downloader.downloadUnzipAll(
    clangdFormatUrl,
    build,
    clangFormatExecutablePath,
    force,
    {
      strip: 1,
    }
  );
})();
