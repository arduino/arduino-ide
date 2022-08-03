//@ts-check

(async () => {
  const fs = require('fs');
  const join = require('path').join;
  const shell = require('shelljs');
  const glob = require('glob');
  const isCI = require('is-ci');
  shell.env.THEIA_ELECTRON_SKIP_REPLACE_FFMPEG = '1'; // Do not run the ffmpeg validation for the packager.
  // Note, this will crash on PI if the available memory is less than desired heap size.
  // https://github.com/shelljs/shelljs/issues/1024#issuecomment-1001552543
  shell.env.NODE_OPTIONS = '--max_old_space_size=4096'; // Increase heap size for the CI
  shell.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true'; // Skip download and avoid `ERROR: Failed to download Chromium`.
  const template = require('./config').generateTemplate(
    new Date().toISOString()
  );
  const utils = require('./utils');
  const merge = require('deepmerge');
  const { isRelease, getChannelFile } = utils;
  const { version } = template;
  const { productName } = template.build;

  echo(`📦  Building ${isRelease ? 'release ' : ''}version '${version}'...`);

  const workingCopy = 'working-copy';

  /**
   * Relative path from the `__dirname` to the root where the `arduino-ide-extension` and the `electron-app` folders are.
   * This could come handy when moving the location of the `electron/packager`.
   */
  const rootPath = join('..', '..');

  // This is a HACK! We rename the root `node_modules` to something else. Otherwise, due to the hoisting,
  // multiple Theia extensions will be picked up.
  if (fs.existsSync(path(rootPath, 'node_modules'))) {
    // We either do this or change the project structure.
    echo(
      "🔧  >>> [Hack] Renaming the root 'node_modules' folder to '.node_modules'..."
    );
    mv('-f', path(rootPath, 'node_modules'), path(rootPath, '.node_modules'));
    echo(
      "👌  <<< [Hack] Renamed the root 'node_modules' folder to '.node_modules'."
    );
  }

  //---------------------------+
  // Clean the previous state. |
  //---------------------------+
  // rm -rf ../working-copy
  rm('-rf', path('..', workingCopy));
  // Clean up the `./electron/build` folder.
  const resourcesToKeep = [
    'patch',
    'resources',
    'scripts',
    'template-package.json',
    'webpack.config.js'
  ];
  fs.readdirSync(path('..', 'build'))
    .filter((filename) => resourcesToKeep.indexOf(filename) === -1)
    .forEach((filename) => rm('-rf', path('..', 'build', filename)));

  // Clean up the `./electron/build/patch` and `./electron/build/resources` folder with Git.
  // To avoid file duplication between bundled app and dev mode, some files are copied from `./electron-app` to `./electron/build` folder.
  const foldersToSyncFromDev = ['patch', 'resources'];
  foldersToSyncFromDev.forEach(filename => shell.exec(`git -C ${path('..', 'build', filename)} clean -ffxdq`, { async: false }));

  const extensions = require('./extensions.json');
  echo(
    `Building the application with the following extensions:\n${extensions
      .map((ext) => ` - ${ext}`)
      .join(',\n')}`
  );
  const allDependencies = [...extensions, 'electron-app'];

  //----------------------------------------------------------------------------------------------+
  // Copy the following items into the `working-copy` folder. Make sure to reuse the `yarn.lock`. |
  //----------------------------------------------------------------------------------------------+
  mkdir('-p', path('..', workingCopy));
  for (const filename of [
    ...allDependencies,
    'yarn.lock',
    'package.json',
    'lerna.json',
    'i18n'
  ]) {
    cp('-rf', path(rootPath, filename), path('..', workingCopy));
  }

  //---------------------------------------------------------------------------------------------+
  // Copy the patched `index.js` for the frontend, the Theia preload, etc. from `./electron-app` |
  //---------------------------------------------------------------------------------------------+
  for (const filename of foldersToSyncFromDev) {
    cp('-rf', path('..', workingCopy, 'electron-app', filename), path('..', 'build'));
  }

  //----------------------------------------------+
  // Sanity check: all versions must be the same. |
  //----------------------------------------------+
  verifyVersions(allDependencies);

  //----------------------------------------------------------------------+
  // Use the nightly patch version if not a release but requires publish. |
  //----------------------------------------------------------------------+
  if (!isRelease) {
    for (const dependency of allDependencies) {
      const pkg = require(`../working-copy/${dependency}/package.json`);
      pkg.version = version;
      for (const dependency in pkg.dependencies) {
        if (allDependencies.indexOf(dependency) !== -1) {
          pkg.dependencies[dependency] = version;
        }
      }
      fs.writeFileSync(
        path('..', workingCopy, dependency, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );
    }
  }
  verifyVersions(allDependencies);

  //-------------------------------------------------------------+
  // Save some time: no need to build the `browser-app` example. |
  //-------------------------------------------------------------+
  //@ts-ignore
  let pkg = require('../working-copy/package.json');
  const workspaces = pkg.workspaces;
  // We cannot remove the `electron-app`. Otherwise, there is not way to collect the unused dependencies.
  const dependenciesToRemove = ['browser-app'];
  for (const dependencyToRemove of dependenciesToRemove) {
    const index = workspaces.indexOf(dependencyToRemove);
    if (index !== -1) {
      workspaces.splice(index, 1);
    }
  }
  pkg.workspaces = workspaces;
  fs.writeFileSync(
    path('..', workingCopy, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );

  //-------------------------------------------------------------------------------------------------+
  // Rebuild the extension with the copied `yarn.lock`. It is a must to use the same Theia versions. |
  //-------------------------------------------------------------------------------------------------+
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', workingCopy)}`,
    `Building the ${productName} application`
  );

  //-------------------------------------------------------------------------------------------------------------------------+
  // Test the application. With this approach, we cannot publish test results to GH Actions but save 6-10 minutes per builds |
  //-------------------------------------------------------------------------------------------------------------------------+
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', workingCopy)} test`,
    `Testing the ${productName} application`
  );

  // Collect all unused dependencies by the backend. We have to remove them from the electron app.
  // The `bundle.js` already contains everything we need for the frontend.
  // We have to do it before changing the dependencies to `local-path`.
  const unusedDependencies = await utils.collectUnusedDependencies(
    '../working-copy/electron-app/'
  );

  //-------------------------------------------------------------------------------------------------------------+
  // Change the regular NPM dependencies to `local-paths`, so that we can build them without any NPM registries. |
  //-------------------------------------------------------------------------------------------------------------+
  for (const extension of extensions) {
    if (extension !== 'arduino-ide-extension') {
      // Do not unlink self.
      // @ts-ignore
      pkg = require(`../working-copy/${extension}/package.json`);
      // @ts-ignore
      pkg.dependencies['arduino-ide-extension'] =
        'file:../arduino-ide-extension';
      fs.writeFileSync(
        path('..', workingCopy, extension, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );
    }
  }

  //------------------------------------------------------------------------------------+
  // Merge the `working-copy/package.json` with `electron/build/template-package.json`. |
  //------------------------------------------------------------------------------------+
  // @ts-ignore
  pkg = require('../working-copy/electron-app/package.json');
  template.build.files = [
    ...template.build.files,
    ...unusedDependencies.map((name) => `!node_modules/${name}`),
  ];

  const dependencies = {};
  for (const extension of extensions) {
    dependencies[extension] = `file:../working-copy/${extension}`;
  }
  // @ts-ignore
  pkg.dependencies = { ...pkg.dependencies, ...dependencies };
  pkg.devDependencies = { ...pkg.devDependencies, ...template.devDependencies };
  // Deep-merging the Theia application configuration. We enable the electron window reload in dev mode but not for the final product. (arduino/arduino-pro-ide#187)
  // @ts-ignore
  const theia = merge(pkg.theia || {}, template.theia || {});
  const content = {
    ...pkg,
    ...template,
    theia,
    // @ts-ignore
    dependencies: pkg.dependencies,
    devDependencies: pkg.devDependencies,
  };
  const overwriteMerge = (destinationArray, sourceArray, options) =>
    sourceArray;
  fs.writeFileSync(
    path('..', 'build', 'package.json'),
    JSON.stringify(
      merge(content, template, { arrayMerge: overwriteMerge }),
      null,
      2
    )
  );

  echo(`📜  Effective 'package.json' for the ${productName} application is:
-----------------------
${fs.readFileSync(path('..', 'build', 'package.json')).toString()}
-----------------------
    `);

  // Make sure the original `yarn.lock` file is used from the electron application.
  if (fs.existsSync(path('..', 'build', 'yarn.lock'))) {
    echo(`${path('..', 'build', 'yarn.lock')} must not exist.`);
    shell.exit(1);
  }
  cp('-rf', path(rootPath, 'yarn.lock'), path('..', 'build'));
  if (!fs.existsSync(path('..', 'build', 'yarn.lock'))) {
    echo(`${path('..', 'build', 'yarn.lock')} does not exist.`);
    shell.exit(1);
  }

  //-------------------------------------------------------------------------------------------+
  // Install all private and public dependencies for the electron application and build Theia. |
  //-------------------------------------------------------------------------------------------+
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', 'build')}`,
    'Installing dependencies'
  );
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', 'build')} build`,
    `Building the ${productName} application`
  );
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', 'build')} rebuild`,
    'Rebuild native dependencies'
  );

  //------------------------------------------------------------------------------+
  // Create a throw away dotenv file which we use to feed the builder with input. |
  //------------------------------------------------------------------------------+
  const dotenv = 'electron-builder.env';
  if (fs.existsSync(path('..', 'build', dotenv))) {
    rm('-rf', path('..', 'build', dotenv));
  }
  // For the releases we use the desired tag as is defined by `$(Release.Tag)` from Azure.
  // For the preview builds we use the version from the `electron/build/package.json` with the short commit hash.
  fs.writeFileSync(path('..', 'build', dotenv), `ARDUINO_VERSION=${version}`);

  //-----------------------------------+
  // Package the electron application. |
  //-----------------------------------+
  exec(
    `yarn --network-timeout 1000000 --cwd ${path('..', 'build')} package`,
    `Packaging your ${productName} application`
  );

  //-----------------------------------------------------------------------------------------------------+
  // Recalculate artifacts hash and copy to another folder (because they can change after signing them).
  // Azure does not support wildcard for `PublishBuildArtifacts@1.pathToPublish` |
  //-----------------------------------------------------------------------------------------------------+
  if (isCI) {
    try {
      await recalculateArtifactsHash();
      await copyFilesToBuildArtifacts();
    } catch (e) {
      echo(JSON.stringify(e));
      shell.exit(1);
    }
  }
  echo(`🎉  Success. Your application is at: ${path('..', 'build', 'dist')}`);

  restore();

  //--------+
  // Utils. |
  //--------+
  function exec(command, toEcho) {
    if (toEcho) {
      echo(`⏱️  >>> ${toEcho}...`);
    }
    const { code, stderr, stdout } = shell.exec(command);
    if (code !== 0) {
      echo(`🔥  Error when executing ${command} => ${stderr}`);
      shell.exit(1);
    }
    if (toEcho) {
      echo(`👌  <<< ${toEcho}.`);
    }
    return stdout;
  }

  function cp(options, source, destination) {
    shell.cp(options, source, destination);
    assertNoError();
  }

  function rm(options, ...files) {
    shell.rm(options, files);
    assertNoError();
  }

  function mv(options, source, destination) {
    shell.mv(options, source, destination);
    assertNoError();
  }

  function mkdir(options, ...dir) {
    shell.mkdir(options, dir);
    assertNoError();
  }

  function echo(command) {
    return shell.echo(command);
  }

  function assertNoError() {
    const error = shell.error();
    if (error) {
      echo(error);
      restore();
      shell.exit(1);
    }
  }

  function restore() {
    if (fs.existsSync(path(rootPath, '.node_modules'))) {
      echo(
        "🔧  >>> [Restore] Renaming the root '.node_modules' folder to 'node_modules'..."
      );
      mv('-f', path(rootPath, '.node_modules'), path(rootPath, 'node_modules'));
      echo(
        "👌  >>> [Restore] Renamed the root '.node_modules' folder to 'node_modules'."
      );
    }
  }

  async function copyFilesToBuildArtifacts() {
    echo(`🚢  Detected CI, moving build artifacts...`);
    const { platform } = process;
    const cwd = path('..', 'build', 'dist');
    const targetFolder = path('..', 'build', 'dist', 'build-artifacts');
    mkdir('-p', targetFolder);
    const filesToCopy = [];
    const channelFile = getChannelFile(platform);
    // Channel file might be an empty string if we're not building a
    // nightly or a full release. This can happen when building a package
    // locally or a tester build when creating a new PR on GH.
    if (!!channelFile && fs.existsSync(join(cwd, channelFile))) {
      const channelFilePath = join(cwd, channelFile);
      const newChannelFilePath = channelFilePath
        ?.replace('latest', 'stable')
        ?.replace('beta', 'nightly');
      echo(`🔨  >>> Renaming ${channelFilePath} to ${newChannelFilePath}.`);
      cp('-f', channelFilePath, newChannelFilePath);
      filesToCopy.push(newChannelFilePath);
    }
    switch (platform) {
      case 'linux': {
        filesToCopy.push(
          ...glob
            .sync('**/arduino-ide*.{zip,AppImage}', { cwd })
            .map((p) => join(cwd, p))
        );
        break;
      }
      case 'win32': {
        filesToCopy.push(
          ...glob
            .sync('**/arduino-ide*.{exe,msi,zip}', { cwd })
            .map((p) => join(cwd, p))
        );
        break;
      }
      case 'darwin': {
        filesToCopy.push(
          ...glob
            .sync('**/arduino-ide*.{dmg,zip}', { cwd })
            .map((p) => join(cwd, p))
        );
        break;
      }
      default: {
        echo(`Unsupported platform: ${platform}.`);
        shell.exit(1);
      }
    }
    if (!filesToCopy.length) {
      echo(`Could not collect any build artifacts from ${cwd}.`);
      shell.exit(1);
    }
    for (const fileToCopy of filesToCopy) {
      echo(`🚢  >>> Copying ${fileToCopy} to ${targetFolder}.`);
      const isZip = await utils.isZip(fileToCopy);
      if (isZip && platform === 'linux') {
        await utils.adjustArchiveStructure(fileToCopy, targetFolder);
      } else {
        cp('-rf', fileToCopy, targetFolder);
      }
      echo(`👌  >>> Copied ${fileToCopy} to ${targetFolder}.`);
    }
  }

  async function recalculateArtifactsHash() {
    echo(`🚢  Detected CI, recalculating artifacts hash...`);
    const { platform } = process;
    const cwd = path('..', 'build', 'dist');
    const channelFilePath = join(cwd, getChannelFile(platform));
    const yaml = require('yaml');

    try {
      let fileContents = fs.readFileSync(channelFilePath, 'utf8');
      const newChannelFile = yaml.parse(fileContents);
      const { files, path } = newChannelFile;
      const newSha512 = await hashFile(join(cwd, path));
      newChannelFile.sha512 = newSha512;
      if (!!files) {
        const newFiles = [];
        for (let file of files) {
          const { url } = file;
          const { size } = fs.statSync(join(cwd, url));
          const newSha512 = await hashFile(join(cwd, url));

          if (!newFiles.find((f) => f.sha512 === newSha512)) {
            newFiles.push({ ...file, sha512: newSha512, size });
          }
        }
        newChannelFile.files = newFiles;
      }

      const newChannelFileRaw = yaml.stringify(newChannelFile);
      fs.writeFileSync(channelFilePath, newChannelFileRaw);
      echo(`👌  >>> Channel file updated successfully. New channel file:`);
      echo(newChannelFileRaw);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * @param {import('fs').PathLike} file
   * @param {string|undefined} [algorithm="sha512"]
   * @param {BufferEncoding|undefined} [encoding="base64"]
   * @param {object|undefined} [options]
   */
  async function hashFile(
    file,
    algorithm = 'sha512',
    encoding = 'base64',
    options
  ) {
    const crypto = require('crypto');
    return await new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      hash.on('error', reject).setEncoding(encoding);
      fs.createReadStream(
        file,
        Object.assign({}, options, {
          highWaterMark: 1024 * 1024,
          /* better to use more memory but hash faster */
        })
      )
        .on('error', reject)
        .on('end', () => {
          hash.end();
          resolve(hash.read());
        })
        .pipe(hash, {
          end: false,
        });
    });
  }

  /**
   * Joins tha path from `__dirname`.
   */
  function path(...paths) {
    return join(__dirname, ...paths);
  }

  function verifyVersions(allDependencies, expectedVersion) {
    const versions = new Set();
    for (const dependency of allDependencies) {
      versions.add(
        require(`../working-copy/${dependency}/package.json`).version
      );
    }
    if (versions.size !== 1) {
      echo(
        `Mismatching version configuration. All dependencies must have the same version. Versions were: ${JSON.stringify(
          Array.from(versions),
          null,
          2
        )}.`
      );
      shell.exit(1);
    }
    if (expectedVersion) {
      if (!versions.has(expectedVersion)) {
        echo(
          `Mismatching version configuration. Expected version was: '${expectedVersion}' actual was: '${Array.from(versions)[0]
          }'.`
        );
        shell.exit(1);
      }
    }
  }
})();
