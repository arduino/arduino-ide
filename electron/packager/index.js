//@ts-check
(async () => {
  const toDispose = [];
  const disposeAll = () => {
    let disposable = toDispose.pop();
    while (disposable) {
      try {
        disposable();
      } catch (err) {
        console.error(err);
      }
      disposable = toDispose.pop();
    }
  };
  process.on('uncaughtException', (error) => {
    disposeAll();
    throw error;
  });
  process.on('unhandledRejection', (reason) => {
    disposeAll();
    throw reason;
  });

  const fs = require('fs');
  const join = require('path').join;
  const shell = require('shelljs');
  const { echo, cp, mkdir, mv, rm } = shell;
  shell.config.fatal = true;
  const glob = require('glob');
  const isCI = require('is-ci');
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

  const repoRoot = join(__dirname, '..', '..');
  /**
   * Extensions are expected to be folders directly available from the repository root.
   */
  const extensions = require('./extensions.json');
  echo(
    `Building the application with the following extensions:\n${extensions
      .map((ext) => ` - ${ext}`)
      .join(',\n')}`
  );

  try {
    //---------------------------+
    // Clean the previous state. |
    //---------------------------+
    // Clean up the `./electron/build` folder.
    const resourcesToKeep = [
      'patch',
      'resources',
      'scripts',
      'template-package.json',
    ];
    fs.readdirSync(join(repoRoot, 'electron', 'build'))
      .filter((filename) => resourcesToKeep.indexOf(filename) === -1)
      .forEach((filename) =>
        rm('-rf', join(repoRoot, 'electron', 'build', filename))
      );

    // Clean up the `./electron/build/resources` folder with Git.
    // To avoid file duplication between bundled app and dev mode, some files are copied from `./electron-app` to `./electron/build` folder.
    const foldersToSyncFromDev = ['resources'];
    foldersToSyncFromDev.forEach((filename) =>
      shell.exec(
        `git -C ${join(repoRoot, 'electron', 'build', filename)} clean -ffxdq`,
        {
          async: false,
        }
      )
    );

    //----------------------------------------------------+
    // Copy the Theia preload, etc. from `./electron-app` |
    //----------------------------------------------------+
    for (const filename of foldersToSyncFromDev) {
      cp(
        '-rf',
        join(repoRoot, 'electron-app', filename),
        join(repoRoot, 'electron', 'build')
      );
    }

    //----------------------------------------------+
    // Sanity check: all versions must be the same. |
    //----------------------------------------------+
    verifyVersions(extensions);

    //-------------------------------+
    // Build and test the extensions |
    //-------------------------------+
    for (const extension of extensions) {
      exec(
        `yarn --network-timeout 1000000 --cwd ${join(repoRoot, extension)}`,
        `Building and testing ${extension}`
      );
      exec(
        `yarn --network-timeout 1000000 --cwd ${join(
          repoRoot,
          extension
        )} test:slow`,
        `Executing slow tests ${extension}`
      );
    }

    //------------------------+
    // Publish the extensions |
    //------------------------+
    const npmrc = join(repoRoot, '.npmrc');
    const storage = join(__dirname, 'npm-registry', 'storage');
    rm('-rf', npmrc);
    rm('-rf', storage);
    // To avoid interactive npm login on the CI when publishing to the private registry.
    // The actual token is fake and does not matter as the publishing is `$anonymous` anyway.
    fs.writeFileSync(npmrc, '//localhost:4873/:_authToken=placeholder\n', {
      encoding: 'utf8',
    });
    toDispose.push(() => rm('-rf', storage));
    toDispose.push(() => rm('-rf', npmrc));
    const npmProxyProcess = await startNpmRegistry(
      join(__dirname, 'npm-registry', 'config.yml')
    );
    toDispose.push(() => {
      if (!npmProxyProcess.killed) {
        npmProxyProcess.kill();
      }
    });
    for (const extension of extensions) {
      const packageJsonPath = join(repoRoot, extension, 'package.json');
      const versionToRestore = readJson(packageJsonPath).version;
      exec(
        `yarn --network-timeout 1000000 --cwd ${join(
          repoRoot,
          extension
        )} publish --ignore-scripts --new-version ${version} --no-git-tag-version --registry http://localhost:4873`,
        `Publishing ${extension}@${version} to the private npm registry`
      );
      // Publishing will change the version number, this should be reverted up after the build.
      // A git checkout or reset could be easier, but this is safer to avoid wiping uncommitted dev state.
      toDispose.push(() => {
        const json = readJson(packageJsonPath);
        json.version = versionToRestore;
        writeJson(packageJsonPath, json);
      });
    }

    //-----------------------------------------------------------------------------------------------------------+
    // Merge the `./package.json` and `./electron-app/package.json` with `electron/build/template-package.json`. |
    //-----------------------------------------------------------------------------------------------------------+
    const rootPackageJson = readJson(join(repoRoot, 'package.json'));
    const appPackageJson = readJson(
      join(repoRoot, 'electron-app', 'package.json')
    );
    const dependencies = {};
    for (const extension of extensions) {
      dependencies[extension] = version;
    }
    appPackageJson.dependencies = {
      ...appPackageJson.dependencies,
      ...dependencies,
    };
    appPackageJson.devDependencies = {
      ...appPackageJson.devDependencies,
      ...template.devDependencies,
    };
    // Deep-merging the Theia application configuration.
    const theia = merge(appPackageJson.theia || {}, template.theia || {});
    const content = {
      ...appPackageJson,
      ...template,
      theia,
      dependencies: appPackageJson.dependencies,
      devDependencies: appPackageJson.devDependencies,
      // VS Code extensions and the plugins folder is defined in the root `package.json`. The template picks them up.
      theiaPluginsDir: rootPackageJson.theiaPluginsDir,
      theiaPlugins: rootPackageJson.theiaPlugins,
    };
    writeJson(
      join(repoRoot, 'electron', 'build', 'package.json'),
      merge(content, template, {
        arrayMerge: (_, sourceArray) => sourceArray,
      })
    );

    echo(`📜  Effective 'package.json' for the ${productName} application:
-----------------------
${fs
  .readFileSync(join(repoRoot, 'electron', 'build', 'package.json'))
  .toString()}
-----------------------
    `);

    // Make sure the original `yarn.lock` file is used from the electron application.
    if (fs.existsSync(join(repoRoot, 'electron', 'build', 'yarn.lock'))) {
      echo(
        `${join(repoRoot, 'electron', 'build', 'yarn.lock')} must not exist.`
      );
      shell.exit(1);
    }
    cp('-rf', join(repoRoot, 'yarn.lock'), join(repoRoot, 'electron', 'build'));
    if (!fs.existsSync(join(repoRoot, 'electron', 'build', 'yarn.lock'))) {
      echo(
        `${join(repoRoot, 'electron', 'build', 'yarn.lock')} does not exist.`
      );
      shell.exit(1);
    }

    // This is a HACK! We rename the root `node_modules` to something else. Otherwise, due to the hoisting,
    // multiple Theia extensions will be picked up.
    if (fs.existsSync(join(repoRoot, 'node_modules'))) {
      // We either do this or change the project structure.
      echo(
        "🔧  >>> [Hack] Renaming the root 'node_modules' folder to '.node_modules'..."
      );
      mv('-f', join(repoRoot, 'node_modules'), join(repoRoot, '.node_modules'));
      echo(
        "👌  <<< [Hack] Renamed the root 'node_modules' folder to '.node_modules'."
      );
    }
    toDispose.push(() => {
      if (fs.existsSync(join(repoRoot, '.node_modules'))) {
        echo(
          "🔧  >>> [Restore] Renaming the root '.node_modules' folder to 'node_modules'..."
        );
        mv(
          '-f',
          join(repoRoot, '.node_modules'),
          join(repoRoot, 'node_modules')
        );
        echo(
          "👌  >>> [Restore] Renamed the root '.node_modules' folder to 'node_modules'."
        );
      }
    });

    //-------------------------------------------------------------------------------------------+
    // Install all private and public dependencies for the electron application and build Theia. |
    //-------------------------------------------------------------------------------------------+
    exec(
      `yarn --network-timeout 1000000 --cwd ${join(
        repoRoot,
        'electron',
        'build'
      )} --registry http://localhost:4873`,
      'Installing dependencies'
    );
    exec(
      `yarn --cwd ${join(repoRoot, 'electron', 'build')} build`,
      `Building the ${productName} application`
    );
    exec(
      `yarn --cwd ${join(repoRoot, 'electron', 'build')} rebuild`,
      'Rebuilding native dependencies'
    );

    //------------------------------------------------------------------------------+
    // Create a throw away dotenv file which we use to feed the builder with input. |
    //------------------------------------------------------------------------------+
    const dotenv = 'electron-builder.env';
    if (fs.existsSync(join(repoRoot, 'electron', 'build', dotenv))) {
      rm('-rf', join(repoRoot, 'electron', 'build', dotenv));
    }
    // For the releases we use the desired tag as is defined by `$(Release.Tag)` from Azure.
    // For the preview builds we use the version from the `electron/build/package.json` with the short commit hash.
    fs.writeFileSync(
      join(repoRoot, 'electron', 'build', dotenv),
      `ARDUINO_VERSION=${version}`
    );

    //-----------------------------------+
    // Package the electron application. |
    //-----------------------------------+
    exec(
      `yarn --cwd ${join(repoRoot, 'electron', 'build')} package`,
      `Packaging the ${productName} application`
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
    echo(
      `🎉  Success. The application is at: ${join(
        repoRoot,
        'electron',
        'build',
        'dist'
      )}`
    );
  } finally {
    disposeAll();
  }

  //--------+
  // Utils. |
  //--------+
  function exec(command, toEcho) {
    if (toEcho) {
      echo(`⏱️  >>> ${toEcho}...`);
    }
    const { stdout } = shell.exec(command);
    if (toEcho) {
      echo(`👌  <<< ${toEcho}.`);
    }
    return stdout;
  }

  async function copyFilesToBuildArtifacts() {
    echo(`🚢  Detected CI, moving build artifacts...`);
    const { platform } = process;
    const cwd = join(repoRoot, 'electron', 'build', 'dist');
    const targetFolder = join(
      repoRoot,
      'electron',
      'build',
      'dist',
      'build-artifacts'
    );
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
    const cwd = join(repoRoot, 'electron', 'build', 'dist');
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
  function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
    const crypto = require('crypto');
    return new Promise((resolve, reject) => {
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
   * @param {string[]} allDependencies
   * @param {string} [expectedVersion]
   */
  function verifyVersions(allDependencies, expectedVersion) {
    const versions = new Set();
    for (const dependency of allDependencies) {
      versions.add(
        readJson(join(repoRoot, dependency, 'package.json')).version
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
          `Mismatching version configuration. Expected version was: '${expectedVersion}' actual was: '${
            Array.from(versions)[0]
          }'.`
        );
        shell.exit(1);
      }
    }
  }

  /**
   * @param {string} configPath
   * @return {Promise<import('child_process').ChildProcess>}
   */
  function startNpmRegistry(configPath) {
    return new Promise((resolve, reject) => {
      const fork = require('child_process').fork(
        require.resolve('verdaccio/bin/verdaccio'),
        ['-c', configPath]
      );
      fork.on('message', (msg) => {
        if (typeof msg === 'object' && 'verdaccio_started' in msg) {
          resolve(fork);
        }
      });
      fork.on('error', reject);
      fork.on('disconnect', reject);
    });
  }

  /**
   * @param {string} path
   * @param {object} jsonObject
   */
  function writeJson(path, jsonObject) {
    fs.writeFileSync(path, JSON.stringify(jsonObject, null, 2) + '\n');
  }

  /**
   * @param {string} path
   * @return {object}
   */
  function readJson(path) {
    const raw = fs.readFileSync(path, { encoding: 'utf8' });
    return JSON.parse(raw);
  }
})();
