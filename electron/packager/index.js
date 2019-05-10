//@ts-check

(async () => {

    const fs = require('fs');
    const join = require('path').join;
    const shell = require('shelljs');
    shell.env.THEIA_ELECTRON_SKIP_REPLACE_FFMPEG = '1';
    const utils = require('./utils');
    const { version, release } = utils.versionInfo();

    echo(`📦  Building ${release ? 'release ' : ''}version '${version}'...`);

    const workingCopy = 'working-copy';

    /**
     * Relative path from the `__dirname` to the root where the `arduino-ide-extension` and the `arduino-ide-electron` folders are.
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
    // rm -rf ../build/dist
    rm('-rf', path('..', 'build', 'dist'));
    // rm -rf ../build/package.json
    rm('-rf', path('..', 'build', 'package.json'));

    //----------------------------------------------------------------------------------------------+
    // Copy the following items into the `working-copy` folder. Make sure to reuse the `yarn.lock`. |
    //----------------------------------------------------------------------------------------------+
    mkdir('-p', path('..', workingCopy));
    for (const name of ['arduino-ide-extension', 'arduino-ide-electron', 'yarn.lock', 'package.json', 'lerna.json']) {
        cp('-rf', path(rootPath, name), path('..', workingCopy));
    }

    //-----------------------------------------------------+
    // No need to build the `arduino-ide-browser` example. |
    //-----------------------------------------------------+
    //@ts-ignore
    let pkg = require('../working-copy/package.json');
    const workspaces = pkg.workspaces;
    // We cannot remove the `arduino-ide-electron`. Otherwise, there is not way to collect the unused dependencies.
    const dependenciesToRemove = ['arduino-ide-browser'];
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
    exec(`yarn --cwd ${path('..', workingCopy)}`, 'Building the Arduino Theia extensions');
    // Collect all unused dependencies by the backend. We have to remove them from the electron app.
    // The `bundle.js` already contains everything we need for the frontend.
    // We have to do it before changing the dependencies to `local-path`.
    const unusedDependencies = await utils.collectUnusedDependencies('../working-copy/arduino-ide-electron/');

    //------------------------------------------------------------------------------------+
    // Merge the `working-copy/package.json` with `electron/build/template-package.json`. |
    //------------------------------------------------------------------------------------+
    // @ts-ignore
    pkg = require('../working-copy/arduino-ide-electron/package.json');
    // @ts-ignore
    const template = require('../build/template-package.json');
    template.build.files = [ ...template.build.files, ...unusedDependencies.map(name => `!node_modules/${name}`) ];
    pkg.dependencies = { ...pkg.dependencies, ...template.dependencies };
    pkg.devDependencies = { ...pkg.devDependencies, ...template.devDependencies };
    fs.writeFileSync(path('..', 'build', 'package.json'), JSON.stringify({
        ...pkg,
        ...template,
        dependencies: pkg.dependencies,
        devDependencies: pkg.devDependencies
    }, null, 2));

    echo(`📜  Effective 'package.json' for the Arduino-PoC application is:
-----------------------
${fs.readFileSync(path('..', 'build', 'package.json')).toString()}
-----------------------
    `);

    //-------------------------------------------------------------------------------------------+
    // Install all private and public dependencies for the electron application and build Theia. |
    //-------------------------------------------------------------------------------------------+
    exec(`yarn --cwd ${path('..', 'build')}`, 'Installing dependencies');
    exec(`yarn --cwd ${path('..', 'build')} build${release ? ':release' : ''}`, 'Building the Arduino-PoC application');

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
    exec(`yarn --cwd ${path('..', 'build')} package`, `Packaging your Arduino-PoC application`);
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

    /**
     * Joins tha path from `__dirname`.
     */
    function path(...paths) {
        return join(__dirname, ...paths);
    }

})();