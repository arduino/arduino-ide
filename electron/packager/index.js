//@ts-check

(async () => {

    const fs = require('fs');
    const join = require('path').join;
    const shell = require('shelljs');
    const glob = require('glob');
    const isCI = require('is-ci');
    shell.env.THEIA_ELECTRON_SKIP_REPLACE_FFMPEG = '1'; // Do not run the ffmpeg validation for the packager.
    shell.env.NODE_OPTIONS = '--max_old_space_size=4096'; // Increase heap size for the CI
    shell.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true'; // Skip download and avoid `ERROR: Failed to download Chromium`.
    const template = require('./config').generateTemplate(new Date().toISOString());
    const utils = require('./utils');
    const merge = require('deepmerge');
    const { isRelease, isElectronPublish } = utils;
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
        echo('🔧  >>> [Hack] Renaming the root \'node_modules\' folder to \'.node_modules\'...');
        mv('-f', path(rootPath, 'node_modules'), path(rootPath, '.node_modules'));
        echo('👌  <<< [Hack] Renamed the root \'node_modules\' folder to \'.node_modules\'.')
    }

    //---------------------------+
    // Clean the previous state. |
    //---------------------------+
    // rm -rf ../working-copy
    rm('-rf', path('..', workingCopy));
    // Clean up the `./electron/build` folder.
    const resourcesToKeep = ['patch', 'resources', 'scripts', 'template-package.json'];
    for (const filename of fs.readdirSync(path('..', 'build')).filter(filename => resourcesToKeep.indexOf(filename) === -1)) {
        rm('-rf', path('..', 'build', filename));
    }

    const extensions = require('./extensions.json');
    echo(`Building the application with the following extensions:\n${extensions.map(ext => ` - ${ext}`).join(',\n')}`);
    const allDependencies = [
        ...extensions,
        'electron-app'
    ]

    //----------------------------------------------------------------------------------------------+
    // Copy the following items into the `working-copy` folder. Make sure to reuse the `yarn.lock`. |
    //----------------------------------------------------------------------------------------------+
    mkdir('-p', path('..', workingCopy));
    for (const name of [...allDependencies, 'yarn.lock', 'package.json', 'lerna.json']) {
        cp('-rf', path(rootPath, name), path('..', workingCopy));
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
            fs.writeFileSync(path('..', workingCopy, dependency, 'package.json'), JSON.stringify(pkg, null, 2));
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
    fs.writeFileSync(path('..', workingCopy, 'package.json'), JSON.stringify(pkg, null, 2));

    //-------------------------------------------------------------------------------------------------+
    // Rebuild the extension with the copied `yarn.lock`. It is a must to use the same Theia versions. |
    //-------------------------------------------------------------------------------------------------+
    exec(`yarn --network-timeout 1000000 --cwd ${path('..', workingCopy)}`, `Building the ${productName} application`);

    //-------------------------------------------------------------------------------------------------------------------------+
    // Test the application. With this approach, we cannot publish test results to GH Actions but save 6-10 minutes per builds |
    //-------------------------------------------------------------------------------------------------------------------------+
    exec(`yarn --network-timeout 1000000 --cwd ${path('..', workingCopy)} test`, `Testing the ${productName} application`);

    // Collect all unused dependencies by the backend. We have to remove them from the electron app.
    // The `bundle.js` already contains everything we need for the frontend.
    // We have to do it before changing the dependencies to `local-path`.
    const unusedDependencies = await utils.collectUnusedDependencies('../working-copy/electron-app/');

    //-------------------------------------------------------------------------------------------------------------+
    // Change the regular NPM dependencies to `local-paths`, so that we can build them without any NPM registries. |
    //-------------------------------------------------------------------------------------------------------------+
    for (const extension of extensions) {
        if (extension !== 'arduino-ide-extension') { // Do not unlink self.
            // @ts-ignore
            pkg = require(`../working-copy/${extension}/package.json`);
            // @ts-ignore
            pkg.dependencies['arduino-ide-extension'] = 'file:../arduino-ide-extension';
            fs.writeFileSync(path('..', workingCopy, extension, 'package.json'), JSON.stringify(pkg, null, 2));
        }
    }

    //------------------------------------------------------------------------------------+
    // Merge the `working-copy/package.json` with `electron/build/template-package.json`. |
    //------------------------------------------------------------------------------------+
    // @ts-ignore
    pkg = require('../working-copy/electron-app/package.json');
    template.build.files = [...template.build.files, ...unusedDependencies.map(name => `!node_modules/${name}`)];

    const dependencies = {};
    for (const extension of extensions) {
        dependencies[extension] = `file:../working-copy/${extension}`;
    }
    // @ts-ignore
    pkg.dependencies = { ...pkg.dependencies, ...dependencies };
    pkg.devDependencies = { ...pkg.devDependencies, ...template.devDependencies };
    // Deep-merging the Theia application configuration. We enable the electron window reload in dev mode but not for the final product. (arduino/arduino-pro-ide#187)
    // @ts-ignore
    const theia = merge((pkg.theia || {}), (template.theia || {}));
    const content = {
        ...pkg,
        ...template,
        theia,
        // @ts-ignore
        dependencies: pkg.dependencies,
        devDependencies: pkg.devDependencies
    };
    const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;
    fs.writeFileSync(path('..', 'build', 'package.json'), JSON.stringify(merge(content, template, { arrayMerge: overwriteMerge }), null, 2));

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
    exec(`yarn --network-timeout 1000000 --cwd ${path('..', 'build')}`, 'Installing dependencies');
    exec(`yarn --network-timeout 1000000 --cwd ${path('..', 'build')} build${isElectronPublish ? ':publish' : ''}`, `Building the ${productName} application`);

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
    exec(`yarn --network-timeout 1000000 --cwd ${path('..', 'build')} package`, `Packaging your ${productName} application`);

    //-----------------------------------------------------------------------------------------------------+
    // Copy to another folder. Azure does not support wildcard for `PublishBuildArtifacts@1.pathToPublish` |
    //-----------------------------------------------------------------------------------------------------+
    if (isCI) {
        try {
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
            echo('🔧  >>> [Restore] Renaming the root \'.node_modules\' folder to \'node_modules\'...');
            mv('-f', path(rootPath, '.node_modules'), path(rootPath, 'node_modules'));
            echo('👌  >>> [Restore] Renamed the root \'.node_modules\' folder to \'node_modules\'.');
        }
    }

    async function copyFilesToBuildArtifacts() {
        echo(`🚢  Detected CI, moving build artifacts...`);
        const { platform } = process;
        const cwd = path('..', 'build', 'dist');
        const targetFolder = path('..', 'build', 'dist', 'build-artifacts');
        mkdir('-p', targetFolder);
        const filesToCopy = [];
        switch (platform) {
            case 'linux': {
                filesToCopy.push(...glob.sync('**/arduino-ide*.{zip,AppImage}', { cwd }).map(p => join(cwd, p)));
                break;
            }
            case 'win32': {
                filesToCopy.push(...glob.sync('**/arduino-ide*.{exe,msi,zip}', { cwd }).map(p => join(cwd, p)));
                break;
            }
            case 'darwin': {
                filesToCopy.push(...glob.sync('**/arduino-ide*.{dmg,zip}', { cwd }).map(p => join(cwd, p)));
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
            if (isZip) {
                await utils.adjustArchiveStructure(fileToCopy, targetFolder);
            } else {
                cp('-rf', fileToCopy, targetFolder);
            }
            echo(`👌  >>> Copied ${fileToCopy} to ${targetFolder}.`);
        }
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
            versions.add(require(`../working-copy/${dependency}/package.json`).version);
        }
        if (versions.size !== 1) {
            echo(`Mismatching version configuration. All dependencies must have the same version. Versions were: ${JSON.stringify(Array.from(versions), null, 2)}.`);
            shell.exit(1);
            process.exit(1);
        }
        if (expectedVersion) {
            if (!versions.has(expectedVersion)) {
                echo(`Mismatching version configuration. Expected version was: '${expectedVersion}' actual was: '${Array.from(versions)[0]}'.`);
                shell.exit(1);
                process.exit(1);
            }
        }
    }

})();
