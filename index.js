const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const semver = require('semver');

const cli = path.join(
  __dirname,
  `arduino-ide-extension/build/arduino-cli${
    os.platform() === 'win32' ? '.exe' : ''
  }`
);

const parseJSON = (jsonPath) => JSON.parse(fs.readFileSync(jsonPath));
const parseYAML = (yamlPath) => yaml.load(fs.readFileSync(yamlPath));
const cliExec = (args) => {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(`"${cli}"`, args, {
      shell: true,
      windowsHide: true,
    });
    child.stdout.on('data', (data) => process.stdout.write(data.toString()));
    child.stderr.on('data', (data) => process.stderr.write(data.toString()));
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject()));
  });
};

(async () => {
  const failedLibs = [];
  const skippedLibs = [];
  const cores = parseJSON(path.join(__dirname, 'cores.json'))
    .filter(({ manually_installed }) => !Boolean(manually_installed))
    .map(({ id, installed: version }) => `${id}@${version}`)
    .join(' ');
  const libs = parseJSON(path.join(__dirname, 'libs.json'))
    .map(({ library }) => library)
    .map(({ name, real_name, version, is_legacy }) => {
      if (!!is_legacy) {
        skippedLibs.push(name);
        return undefined;
      }
      return `"${real_name}"@${
        semver.valid(version) ? version : `${version}.0` // Make semver compliant version: https://github.com/arduino/arduino-cli/issues/1727
      }`;
    })
    .filter((identifier) => Boolean(identifier));
  const urls = parseYAML(path.join(__dirname, 'arduino-cli.yaml')).board_manager
    .additional_urls;
  const additionalUrls = `--additional-urls ${urls.join(',')}`;
  await cliExec(['core', 'update-index', additionalUrls]);
  await cliExec(['lib', 'update-index', additionalUrls]);
  await cliExec(['core', 'install', cores, additionalUrls]);
  for (const lib of libs) {
    try {
      await cliExec(['lib', 'install', lib, additionalUrls]);
    } catch (e) {
      failedLibs.push(lib);
    }
  }
  if (skippedLibs.length) {
    console.log(
      `Skipped installing the following libraries: ${skippedLibs.join(', ')}`
    );
  }
  if (failedLibs.length) {
    console.log(
      `Failed to install the following libraries: ${failedLibs.join(', ')}`
    );
  }
})();
