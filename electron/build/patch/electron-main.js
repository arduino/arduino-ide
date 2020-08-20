// @ts-check

// Useful for Electron/NW.js apps as GUI apps on macOS doesn't inherit the `$PATH` define
// in your dotfiles (.bashrc/.bash_profile/.zshrc/etc).
// https://github.com/electron/electron/issues/550#issuecomment-162037357
// https://github.com/eclipse-theia/theia/pull/3534#issuecomment-439689082
require('fix-path')();

// Workaround for https://github.com/electron/electron/issues/9225. Chrome has an issue where
// in certain locales (e.g. PL), image metrics are wrongly computed. We explicitly set the
// LC_NUMERIC to prevent this from happening (selects the numeric formatting category of the
// C locale, http://en.cppreference.com/w/cpp/locale/LC_categories).
if (process.env.LC_ALL) {
    process.env.LC_ALL = 'C';
}
process.env.LC_NUMERIC = 'C';

const { v4 } = require('uuid');
const electron = require('electron');
const { join, resolve } = require('path');
const { fork } = require('child_process');
const { app, dialog, shell, BrowserWindow, ipcMain, Menu, globalShortcut } = electron;
const { ElectronSecurityToken } = require('@theia/core/lib/electron-common/electron-token');

// Fix the window reloading issue, see: https://github.com/electron/electron/issues/22119
app.allowRendererProcessReuse = false;

const applicationName = `Arduino Pro IDE`;
const isSingleInstance = false;
const disallowReloadKeybinding = false;
const defaultWindowOptionsAdditions = {};


if (isSingleInstance && !app.requestSingleInstanceLock()) {
    // There is another instance running, exit now. The other instance will request focus.
    app.quit();
    return;
}

const nativeKeymap = require('native-keymap');
const Storage = require('electron-store');
const electronStore = new Storage();

const electronSecurityToken = {
    value: v4(),
};

// Make it easy for renderer process to fetch the ElectronSecurityToken:
global[ElectronSecurityToken] = electronSecurityToken;

app.on('ready', () => {

    // Explicitly set the app name to have better menu items on macOS. ("About", "Hide", and "Quit")
    // See: https://github.com/electron-userland/electron-builder/issues/2468
    app.setName(applicationName);

    const { screen } = electron;

    // Remove the default electron menus, waiting for the application to set its own.
    Menu.setApplicationMenu(Menu.buildFromTemplate([{
        role: 'help', submenu: [{ role: 'toggleDevTools' }]
    }]));

    function createNewWindow(theUrl) {

        // We must center by hand because `browserWindow.center()` fails on multi-screen setups
        // See: https://github.com/electron/electron/issues/3490
        const { bounds } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
        const height = Math.floor(bounds.height * (2 / 3));
        const width = Math.floor(bounds.width * (2 / 3));

        const y = Math.floor(bounds.y + (bounds.height - height) / 2);
        const x = Math.floor(bounds.x + (bounds.width - width) / 2);

        const WINDOW_STATE = 'windowstate';
        const windowState = electronStore.get(WINDOW_STATE, {
            width, height, x, y
        });

        const persistedWindowOptionsAdditions = electronStore.get('windowOptions', {});

        const windowOptionsAdditions = {
            ...defaultWindowOptionsAdditions,
            ...persistedWindowOptionsAdditions
        };

        let windowOptions = {
            show: false,
            title: applicationName,
            width: windowState.width,
            height: windowState.height,
            minWidth: 200,
            minHeight: 120,
            x: windowState.x,
            y: windowState.y,
            isMaximized: windowState.isMaximized,
            ...windowOptionsAdditions,
            webPreferences: {
                nodeIntegration: true
            }
        };

        // Always hide the window, we will show the window when it is ready to be shown in any case.
        const newWindow = new BrowserWindow(windowOptions);
        if (windowOptions.isMaximized) {
            newWindow.maximize();
        }
        newWindow.on('ready-to-show', () => newWindow.show());
        if (disallowReloadKeybinding) {
            newWindow.on('focus', event => {
                for (const accelerator of ['CmdOrCtrl+R', 'F5']) {
                    globalShortcut.register(accelerator, () => { });
                }
            });
            newWindow.on('blur', event => globalShortcut.unregisterAll());
        }

        // Prevent calls to "window.open" from opening an ElectronBrowser window,
        // and rather open in the OS default web browser.
        newWindow.webContents.on('new-window', (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });

        // Save the window geometry state on every change
        const saveWindowState = () => {
            try {
                let bounds;
                if (newWindow.isMaximized()) {
                    bounds = electronStore.get(WINDOW_STATE, {});
                } else {
                    bounds = newWindow.getBounds();
                }
                electronStore.set(WINDOW_STATE, {
                    isMaximized: newWindow.isMaximized(),
                    width: bounds.width,
                    height: bounds.height,
                    x: bounds.x,
                    y: bounds.y
                });
            } catch (e) {
                console.error("Error while saving window state.", e);
            }
        };
        let delayedSaveTimeout;
        const saveWindowStateDelayed = () => {
            if (delayedSaveTimeout) {
                clearTimeout(delayedSaveTimeout);
            }
            delayedSaveTimeout = setTimeout(saveWindowState, 1000);
        };
        newWindow.on('close', saveWindowState);
        newWindow.on('resize', saveWindowStateDelayed);
        newWindow.on('move', saveWindowStateDelayed);

        // Fired when a beforeunload handler tries to prevent the page unloading
        newWindow.webContents.on('will-prevent-unload', async event => {
            const { response } = await dialog.showMessageBox(newWindow, {
                type: 'question',
                buttons: ['Yes', 'No'],
                title: 'Confirm',
                message: 'Are you sure you want to quit?',
                detail: 'Any unsaved changes will not be saved.'
            });
            if (response === 0) { // 'Yes'
                // This ignores the beforeunload callback, allowing the page to unload
                event.preventDefault();
            }
        });

        // Notify the renderer process on keyboard layout change
        nativeKeymap.onDidChangeKeyboardLayout(() => {
            if (!newWindow.isDestroyed()) {
                const newLayout = {
                    info: nativeKeymap.getCurrentKeyboardLayout(),
                    mapping: nativeKeymap.getKeyMap()
                };
                newWindow.webContents.send('keyboardLayoutChanged', newLayout);
            }
        });

        if (!!theUrl) {
            newWindow.loadURL(theUrl);
        }
        return newWindow;
    }

    app.on('window-all-closed', () => {
        app.quit();
    });
    ipcMain.on('create-new-window', (event, url) => {
        createNewWindow(url);
    });
    ipcMain.on('open-external', (event, url) => {
        shell.openExternal(url);
    });
    ipcMain.on('set-window-options', (event, options) => {
        electronStore.set('windowOptions', options);
    });
    ipcMain.on('get-persisted-window-options-additions', event => {
        event.returnValue = electronStore.get('windowOptions', {});
    });

    // Check whether we are in bundled application or development mode.
    // @ts-ignore
    const devMode = process.defaultApp || /node_modules[/]electron[/]/.test(process.execPath);
    // Check if we should run everything as one process.
    const noBackendFork = process.argv.includes('--no-cluster');
    const mainWindow = createNewWindow();

    if (isSingleInstance) {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus()
            }
        })
    }

    const setElectronSecurityToken = async port => {
        await electron.session.defaultSession.cookies.set({
            url: `http://localhost:${port}/`,
            name: ElectronSecurityToken,
            value: JSON.stringify(electronSecurityToken),
            httpOnly: true
        });
    };

    const loadMainWindow = port => {
        if (!mainWindow.isDestroyed()) {
            mainWindow.loadURL('file://' + join(__dirname, '../../lib/index.html') + '?port=' + port);
        }
    };

    // We cannot use the `process.cwd()` as the application project path (the location of the `package.json` in other words)
    // in a bundled electron application because it depends on the way we start it. For instance, on OS X, these are a differences:
    // https://github.com/eclipse-theia/theia/issues/3297#issuecomment-439172274
    process.env.THEIA_APP_PROJECT_PATH = resolve(__dirname, '..', '..');

    // Set the electron version for both the dev and the production mode. (https://github.com/eclipse-theia/theia/issues/3254)
    // Otherwise, the forked backend processes will not know that they're serving the electron frontend.
    // The forked backend should patch its `process.versions.electron` with this value if it is missing.
    process.env.THEIA_ELECTRON_VERSION = process.versions.electron;

    const mainPath = join(__dirname, '..', 'backend', 'main');
    // We spawn a separate process for the backend for Express to not run in the Electron main process.
    // See: https://github.com/eclipse-theia/theia/pull/7361#issuecomment-601272212
    // But when in debugging we want to run everything in the same process to make things easier.
    if (noBackendFork) {
        process.env[ElectronSecurityToken] = JSON.stringify(electronSecurityToken);
        require(mainPath).then(async (address) => {
            await setElectronSecurityToken(address.port);
            loadMainWindow(address.port);
        }).catch((error) => {
            console.error(error);
            app.exit(1);
        });
    } else {
        // We want to pass flags passed to the Electron app to the backend process.
        // Quirk: When developing from sources, we execute Electron as `electron.exe electron-main.js ...args`, but when bundled,
        // the command looks like `bundled-application.exe ...args`.
        let args = process.argv.slice(devMode ? 2 : 1);
        if (process.platform === 'darwin') {
            // https://github.com/electron/electron/issues/3657
            // https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder#comment102377986_10242200
            // macOS appends an extra `-psn_0_someNumber` arg if a file is opened from Finder after downloading from the Internet.
            // "AppName" is an app downloaded from the Internet. Are you sure you want to open it?
            args = args.filter(arg => !arg.startsWith('-psn'));
        }
        const cp = fork(mainPath, args, {
            env: Object.assign({
                [ElectronSecurityToken]: JSON.stringify(electronSecurityToken),
            }, process.env)
        });
        cp.on('message', async (address) => {
            await setElectronSecurityToken(address.port);
            loadMainWindow(address.port);
        });
        cp.on('error', (error) => {
            console.error(error);
            app.exit(1);
        });
        app.on('quit', () => {
            // If we forked the process for the clusters, we need to manually terminate it.
            // See: https://github.com/eclipse-theia/theia/issues/835
            process.kill(cp.pid);
        });
    }
});
