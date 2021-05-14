import { inject, injectable } from 'inversify';
import { app, BrowserWindow, BrowserWindowConstructorOptions, Display, screen } from 'electron';
import { fork } from 'child_process';
import { AddressInfo } from 'net';
import { join } from 'path';
import { initSplashScreen } from '../splash/splash-screen';
import { isOSX } from '@theia/core/lib/common/os';
import { MaybePromise } from '@theia/core/lib/common/types';
import { ElectronSecurityToken } from '@theia/core/lib/electron-common/electron-token';
import { FrontendApplicationConfig } from '@theia/application-package/lib/application-props';
import { ElectronMainApplication as TheiaElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { SplashServiceImpl } from '../splash/splash-service-impl';

interface ArduinoWindow {
    readonly window: BrowserWindow;
    readonly state: State;
}
interface State {
    lastFocusTime: number;
}

@injectable()
export class ElectronMainApplication extends TheiaElectronMainApplication {

    protected _windows: ArduinoWindow[] = [];

    @inject(SplashServiceImpl)
    protected readonly splashService: SplashServiceImpl;

    async start(config: FrontendApplicationConfig): Promise<void> {
        // Explicitly set the app name to have better menu items on macOS. ("About", "Hide", and "Quit")
        // See: https://github.com/electron-userland/electron-builder/issues/2468
        // Regression in Theia: https://github.com/eclipse-theia/theia/issues/8701
        app.on('ready', () => app.setName(config.applicationName));
        return super.start(config);
    }

    /**
     * Use this rather than creating `BrowserWindow` instances from scratch, since some security parameters need to be set, this method will do it.
     *
     * @param options
     */
    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultBrowserWindowOptions()): Promise<BrowserWindow> {
        const options = await asyncOptions;
        let electronWindow: BrowserWindow | undefined;
        if (this._windows.length) {
            electronWindow = new BrowserWindow(options);
        } else {
            const { bounds } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
            const splashHeight = 450;
            const splashWidth = 600;
            const splashY = Math.floor(bounds.y + (bounds.height - splashHeight) / 2);
            const splashX = Math.floor(bounds.x + (bounds.width - splashWidth) / 2);
            const splashScreenOpts: BrowserWindowConstructorOptions = {
                height: splashHeight,
                width: splashWidth,
                x: splashX,
                y: splashY,
                transparent: true,
                alwaysOnTop: true,
                focusable: false,
                minimizable: false,
                maximizable: false,
                hasShadow: false,
                resizable: false
            };
            electronWindow = initSplashScreen({
                windowOpts: options,
                templateUrl: join(__dirname, '..', '..', '..', 'src', 'electron-main', 'splash', 'static', 'splash.html'),
                delay: 0,
                minVisible: 2000,
                splashScreenOpts
            }, this.splashService.onCloseRequested);
        }
        this._windows.push({ window: electronWindow, state: { lastFocusTime: -1 } });
        electronWindow.on('closed', () => {
            if (electronWindow) {
                const index = this._windows.findIndex(candidate => candidate.window === electronWindow);
                if (index === -1) {
                    console.warn(`Could not dispose browser window: '${electronWindow.title}'.`);
                } else {
                    this._windows.splice(index, 1);
                    electronWindow = undefined;
                }
            }
        });
        electronWindow.on('focus', () => {
            if (electronWindow) {
                const index = this._windows.findIndex(candidate => candidate.window === electronWindow);
                if (index === -1) {
                    console.warn(`Could not refresh last focus time on browser window: '${electronWindow.title}'.`);
                } else {
                    this._windows[index].state.lastFocusTime = Date.now();
                }
            }
        });
        this.attachReadyToShow(electronWindow);
        this.attachSaveWindowState(electronWindow);
        this.attachGlobalShortcuts(electronWindow);
        this.restoreMaximizedState(electronWindow, options);
        return electronWindow;
    }

    protected async startBackend(): Promise<number> {
        // Check if we should run everything as one process.
        const noBackendFork = process.argv.indexOf('--no-cluster') !== -1;
        // We cannot use the `process.cwd()` as the application project path (the location of the `package.json` in other words)
        // in a bundled electron application because it depends on the way we start it. For instance, on OS X, these are a differences:
        // https://github.com/eclipse-theia/theia/issues/3297#issuecomment-439172274
        process.env.THEIA_APP_PROJECT_PATH = this.globals.THEIA_APP_PROJECT_PATH;
        // Set the electron version for both the dev and the production mode. (https://github.com/eclipse-theia/theia/issues/3254)
        // Otherwise, the forked backend processes will not know that they're serving the electron frontend.
        process.env.THEIA_ELECTRON_VERSION = process.versions.electron;
        if (noBackendFork) {
            process.env[ElectronSecurityToken] = JSON.stringify(this.electronSecurityToken);
            // The backend server main file is supposed to export a promise resolving with the port used by the http(s) server.
            const address: AddressInfo = await require(this.globals.THEIA_BACKEND_MAIN_PATH);
            return address.port;
        } else {
            let args = this.processArgv.getProcessArgvWithoutBin();
            // https://github.com/eclipse-theia/theia/issues/8227
            if (process.platform === 'darwin') {
                // https://github.com/electron/electron/issues/3657
                // https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder#comment102377986_10242200
                // macOS appends an extra `-psn_0_someNumber` arg if a file is opened from Finder after downloading from the Internet.
                // "AppName" is an app downloaded from the Internet. Are you sure you want to open it?
                args = args.filter(arg => !arg.startsWith('-psn'));
            }
            const backendProcess = fork(
                this.globals.THEIA_BACKEND_MAIN_PATH,
                args,
                await this.getForkOptions(),
            );
            console.log(`Starting backend process. PID: ${backendProcess.pid}`);
            return new Promise((resolve, reject) => {
                // The backend server main file is also supposed to send the resolved http(s) server port via IPC.
                backendProcess.on('message', (address: AddressInfo) => {
                    resolve(address.port);
                });
                backendProcess.on('error', error => {
                    reject(error);
                });
                app.on('quit', () => {
                    try {
                        // If we forked the process for the clusters, we need to manually terminate it.
                        // See: https://github.com/eclipse-theia/theia/issues/835
                        process.kill(backendProcess.pid);
                    } catch (e) {
                        if (e.code === 'ESRCH') {
                            console.log('Could not terminate the backend process. It was not running.');
                            return;
                        }
                        throw e;
                    }
                });
            });
        }
    }

    get windows(): BrowserWindow[] {
        return this._windows.map(({ window }) => window);
    }

    get lastActiveWindow(): ArduinoWindow | undefined {
        const maxLastFocusTime = Math.max(...this._windows.map(candidate => candidate.state.lastFocusTime));
        return this._windows.find(candidate => candidate.state.lastFocusTime === maxLastFocusTime);
    }

    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        const windowOptionsFromConfig = this.config.electron?.windowOptions || {};
        let windowState: TheiaBrowserWindowOptions | undefined = this.electronStore.get('windowstate', undefined);
        if (!windowState) {
            windowState = this.getDefaultWindowState();
        }
        return {
            ...(windowState.isMaximized ? windowState : this.ensureNoOverlap(windowState)),
            show: false,
            title: this.config.applicationName,
            minWidth: 200,
            minHeight: 120,
            webPreferences: {
                // https://github.com/eclipse-theia/theia/issues/2018
                nodeIntegration: true,
                // Setting the following option to `true` causes some features to break, somehow.
                // Issue: https://github.com/eclipse-theia/theia/issues/8577
                nodeIntegrationInWorker: false,
            },
            ...windowOptionsFromConfig,
        };
    }

    // tslint:disable-next-line:max-line-length
    // Based on https://github.com/microsoft/vscode/blob/27966a2521da538a5e2731e70155efa47af1a801/src/vs/platform/windows/electron-main/windowsStateHandler.ts#L304-L342
    protected getDefaultWindowState(): BrowserWindowConstructorOptions {
        // We want the new window to open on the same display that the last active one is in
        let displayToUse: Display | undefined;
        const displays = screen.getAllDisplays();
        const lastActive = this.lastActiveWindow;

        // Single Display
        if (displays.length === 1) {
            displayToUse = displays[0];
        } else {
            // Multi Display
            // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
            if (isOSX) {
                const cursorPoint = screen.getCursorScreenPoint();
                displayToUse = screen.getDisplayNearestPoint(cursorPoint);
            }

            // if we have a last active window, use that display for the new window
            if (!displayToUse && lastActive) {
                displayToUse = screen.getDisplayMatching(lastActive.window.getBounds());
            }

            // fallback to primary display or first display
            if (!displayToUse) {
                displayToUse = screen.getPrimaryDisplay() || displays[0];
            }
        }

        const { bounds } = displayToUse;
        const height = Math.floor(bounds.height * (2 / 3));
        const width = Math.floor(bounds.width * (2 / 3));
        const y = Math.floor(bounds.y + (bounds.height - height) / 2);
        const x = Math.floor(bounds.x + (bounds.width - width) / 2);
        return { width, height, x, y };
    }

    // tslint:disable-next-line:max-line-length
    // Based on https://github.com/microsoft/vscode/blob/27966a2521da538a5e2731e70155efa47af1a801/src/vs/platform/windows/electron-main/windowsStateHandler.ts#L375-L389
    protected ensureNoOverlap(state: BrowserWindowConstructorOptions): BrowserWindowConstructorOptions {
        if (this._windows.length === 0) {
            return state;
        }

        state.x = typeof state.x === 'number' ? state.x : 0;
        state.y = typeof state.y === 'number' ? state.y : 0;

        const existingWindowBounds = this._windows.map(window => window.window.getBounds());
        while (existingWindowBounds.some(b => b.x === state.x || b.y === state.y)) {
            state.x += 30;
            state.y += 30;
        }

        return state;
    }

}
