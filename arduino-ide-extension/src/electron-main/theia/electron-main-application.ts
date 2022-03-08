import { inject, injectable } from 'inversify';
import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, screen, Event as ElectronEvent } from '@theia/core/electron-shared/electron';
import { fork } from 'child_process';
import { AddressInfo } from 'net';
import { join, dirname } from 'path';
import * as fs from 'fs-extra';
import { initSplashScreen } from '../splash/splash-screen';
import { MaybePromise } from '@theia/core/lib/common/types';
import { ElectronSecurityToken } from '@theia/core/lib/electron-common/electron-token';
import { FrontendApplicationConfig } from '@theia/application-package/lib/application-props';
import {
  ElectronMainApplication as TheiaElectronMainApplication,
  ElectronMainExecutionParams,
} from '@theia/core/lib/electron-main/electron-main-application';
import { SplashServiceImpl } from '../splash/splash-service-impl';
import { URI } from '@theia/core/shared/vscode-uri';
import * as electronRemoteMain from '@theia/core/electron-shared/@electron/remote/main';
import { Deferred } from '@theia/core/lib/common/promise-util';
import * as os from '@theia/core/lib/common/os';
import { Restart } from '@theia/core/lib/electron-common/messaging/electron-messages';
import { TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/theia-electron-window';

app.commandLine.appendSwitch('disable-http-cache');

interface WorkspaceOptions {
  file: string
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
  isFullScreen: boolean
  time: number
}

const WORKSPACES = 'workspaces';

@injectable()
export class ElectronMainApplication extends TheiaElectronMainApplication {
  protected _windows: BrowserWindow[] = [];
  protected startup = false;
  protected openFilePromise = new Deferred();

  @inject(SplashServiceImpl)
  protected readonly splashService: SplashServiceImpl;

  async start(config: FrontendApplicationConfig): Promise<void> {
    // Explicitly set the app name to have better menu items on macOS. ("About", "Hide", and "Quit")
    // See: https://github.com/electron-userland/electron-builder/issues/2468
    // Regression in Theia: https://github.com/eclipse-theia/theia/issues/8701
    app.on('ready', () => app.setName(config.applicationName));
    this.attachFileAssociations();
    return super.start(config);
  }

  attachFileAssociations() {
    // OSX: register open-file event
    if (os.isOSX) {
      app.on('open-file', async (event, uri) => {
        event.preventDefault();
        if (uri.endsWith('.ino') && await fs.pathExists(uri)) {
          this.openFilePromise.reject();
          await this.openSketch(dirname(uri));
        }
      });
      setTimeout(() => this.openFilePromise.resolve(), 500);
    } else {
      this.openFilePromise.resolve();
    }
  }

  protected async isValidSketchPath(uri: string): Promise<boolean | undefined> {
    return typeof uri === 'string' && await fs.pathExists(uri);
  }

  protected async launch(params: ElectronMainExecutionParams): Promise<void> {
    try {
      // When running on MacOS, we either have to wait until
      // 1. The `open-file` command has been received by the app, rejecting the promise
      // 2. A short timeout resolves the promise automatically, falling back to the usual app launch
      await this.openFilePromise.promise;
    } catch {
      // Application has received the `open-file` event and will skip the default application launch
      return;
    }

    if (!os.isOSX && await this.launchFromArgs(params)) {
      // Application has received a file in its arguments and will skip the default application launch
      return;
    }

    this.startup = true;
    const workspaces: WorkspaceOptions[] | undefined = this.electronStore.get(WORKSPACES);
    let useDefault = true;
    if (workspaces && workspaces.length > 0) {
      for (const workspace of workspaces) {
        if (await this.isValidSketchPath(workspace.file)) {
          useDefault = false;
          await this.openSketch(workspace);
        }
      }
    }
    this.startup = false;
    if (useDefault) {
      super.launch(params);
    }
  }

  protected async launchFromArgs(params: ElectronMainExecutionParams): Promise<boolean> {
    // Copy to prevent manipulation of original array
    const argCopy = [...params.argv];
    let uri: string | undefined;
    for (const possibleUri of argCopy) {
      if (possibleUri.endsWith('.ino') && await this.isValidSketchPath(possibleUri)) {
        uri = possibleUri;
        break;
      }
    }
    if (uri) {
      await this.openSketch(dirname(uri));
      return true;
    }
    return false;
  }

  protected async openSketch(workspace: WorkspaceOptions | string): Promise<BrowserWindow> {
    const options = await this.getLastWindowOptions();
    let file: string;
    if (typeof workspace === 'object') {
      options.x = workspace.x;
      options.y = workspace.y;
      options.width = workspace.width;
      options.height = workspace.height;
      options.isMaximized = workspace.isMaximized;
      options.isFullScreen = workspace.isFullScreen;
      file = workspace.file;
    } else {
      file = workspace;
    }
    const [uri, electronWindow] = await Promise.all([this.createWindowUri(), this.createWindow(options)]);
    electronWindow.loadURL(uri.withFragment(encodeURI(file)).toString(true));
    return electronWindow;
  }

  protected avoidOverlap(options: TheiaBrowserWindowOptions): TheiaBrowserWindowOptions {
    if (this.startup) {
      return options;
    }
    return super.avoidOverlap(options);
  }

  protected getTitleBarStyle(): 'native' | 'custom' {
    return 'native';
  }

  protected hookApplicationEvents(): void {
    app.on('will-quit', this.onWillQuit.bind(this));
    app.on('second-instance', this.onSecondInstance.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));

    ipcMain.on(Restart, ({ sender }) => {
      this.restart(sender.id);
    });
  }

  protected async onSecondInstance(event: ElectronEvent, argv: string[], cwd: string): Promise<void> {
    if (!os.isOSX && await this.launchFromArgs({ cwd, argv, secondInstance: true })) {
      // Application has received a file in its arguments
      return;
    }
    super.onSecondInstance(event, argv, cwd);
  }

  /**
   * Use this rather than creating `BrowserWindow` instances from scratch, since some security parameters need to be set, this method will do it.
   *
   * @param options
   */
  async createWindow(
    asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultTheiaWindowOptions()
  ): Promise<BrowserWindow> {
    let options = await asyncOptions;
    options = this.avoidOverlap(options);
    let electronWindow: BrowserWindow | undefined;
    if (this._windows.length) {
      electronWindow = await super.createWindow(options);
    } else {
      const { bounds } = screen.getDisplayNearestPoint(
        screen.getCursorScreenPoint()
      );
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
        resizable: false,
      };
      electronWindow = initSplashScreen(
        {
          windowOpts: options,
          templateUrl: join(
            __dirname,
            '..',
            '..',
            '..',
            'src',
            'electron-main',
            'splash',
            'static',
            'splash.html'
          ),
          delay: 0,
          minVisible: 2000,
          splashScreenOpts,
        },
        this.splashService.onCloseRequested
      );
    }

    electronWindow.webContents.on(
      'new-window',
      (event, url, frameName, disposition, options) => {
        if (frameName === 'serialPlotter') {
          event.preventDefault();
          Object.assign(options, {
            width: 800,
            minWidth: 620,
            height: 500,
            minHeight: 320,
            x: 100,
            y: 100,
            webPreferences: {
              devTools: true,
              nativeWindowOpen: true,
              openerId: electronWindow?.webContents.id,
            },
          });
          event.newGuest = new BrowserWindow(options);
          event.newGuest.setMenu(null);
          event.newGuest?.on('closed', (e: any) => {
            electronWindow?.webContents.send('CLOSE_CHILD_WINDOW');
          });
          event.newGuest?.loadURL(url);
        }
      }
    );

    this._windows.push(electronWindow);
    electronWindow.on('closed', () => {
      if (electronWindow) {
        const index = this._windows.indexOf(electronWindow);
        if (index === -1) {
          console.warn(
            `Could not dispose browser window: '${electronWindow.title}'.`
          );
        } else {
          this._windows.splice(index, 1);
          electronWindow = undefined;
        }
      }
    });
    this.attachClosedWorkspace(electronWindow);
    electronRemoteMain.enable(electronWindow.webContents);
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
      process.env[ElectronSecurityToken] = JSON.stringify(
        this.electronSecurityToken
      );
      // The backend server main file is supposed to export a promise resolving with the port used by the http(s) server.
      const address: AddressInfo = await require(this.globals
        .THEIA_BACKEND_MAIN_PATH);
      return address.port;
    } else {
      let args = this.processArgv.getProcessArgvWithoutBin();
      // https://github.com/eclipse-theia/theia/issues/8227
      if (process.platform === 'darwin') {
        // https://github.com/electron/electron/issues/3657
        // https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder#comment102377986_10242200
        // macOS appends an extra `-psn_0_someNumber` arg if a file is opened from Finder after downloading from the Internet.
        // "AppName" is an app downloaded from the Internet. Are you sure you want to open it?
        args = args.filter((arg) => !arg.startsWith('-psn'));
      }
      const backendProcess = fork(
        this.globals.THEIA_BACKEND_MAIN_PATH,
        args,
        await this.getForkOptions()
      );
      console.log(`Starting backend process. PID: ${backendProcess.pid}`);
      return new Promise((resolve, reject) => {
        // The backend server main file is also supposed to send the resolved http(s) server port via IPC.
        backendProcess.on('message', (address: AddressInfo) => {
          resolve(address.port);
        });
        backendProcess.on('error', (error) => {
          reject(error);
        });
        app.on('quit', () => {
          try {
            // If we forked the process for the clusters, we need to manually terminate it.
            // See: https://github.com/eclipse-theia/theia/issues/835
            if (backendProcess.pid) {
              process.kill(backendProcess.pid);
            }
          } catch (e) {
            if (e.code === 'ESRCH') {
              console.log(
                'Could not terminate the backend process. It was not running.'
              );
              return;
            }
            throw e;
          }
        });
      });
    }
  }

  protected closedWorkspaces: WorkspaceOptions[] = [];

  protected attachClosedWorkspace(window: BrowserWindow): void {
    // Since the `before-quit` event is only fired when closing the *last* window
    // We need to keep track of recently closed windows/workspaces manually
    window.on('close', () => {
      const url = window.webContents.getURL();
      const workspace = URI.parse(url).fragment;
      if (workspace) {
        const workspaceUri = URI.file(workspace);
        const bounds = window.getNormalBounds();
        this.closedWorkspaces.push({
          ...bounds,
          isMaximized: window.isMaximized(),
          isFullScreen: window.isFullScreen(),
          file: workspaceUri.fsPath,
          time: Date.now()
        })
      }
    });
  }

  protected onWillQuit(event: Electron.Event): void {
    // Only add workspaces which were closed within the last second (1000 milliseconds)
    const threshold = Date.now() - 1000;
    const visited = new Set<string>();
    const workspaces = this.closedWorkspaces.filter(e => {
      if (e.time < threshold || visited.has(e.file)) {
        return false;
      }
      visited.add(e.file);
      return true;
    }).sort((a, b) => a.file.localeCompare(b.file));
    this.electronStore.set(WORKSPACES, workspaces);

    super.onWillQuit(event);
  }

  get browserWindows(): BrowserWindow[] {
      return this._windows;
  }
}
