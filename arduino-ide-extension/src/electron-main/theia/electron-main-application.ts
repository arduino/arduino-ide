import type { FrontendApplicationConfig } from '@theia/application-package/lib/application-props';
import { environment } from '@theia/application-package/lib/environment';
import {
  app,
  BrowserWindow,
  contentTracing,
  Event as ElectronEvent,
  ipcMain,
} from '@theia/core/electron-shared/electron';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { isOSX } from '@theia/core/lib/common/os';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { isObject, MaybePromise, Mutable } from '@theia/core/lib/common/types';
import { ElectronSecurityToken } from '@theia/core/lib/electron-common/electron-token';
import {
  ElectronMainExecutionParams,
  ElectronMainApplication as TheiaElectronMainApplication,
} from '@theia/core/lib/electron-main/electron-main-application';
import type { TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/theia-electron-window';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { URI } from '@theia/core/shared/vscode-uri';
import { log as logToFile, setup as setupFileLog } from 'node-log-rotate';
import { fork } from 'node:child_process';
import { promises as fs, readFileSync, rm, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { isAbsolute, join, resolve } from 'node:path';
import { Sketch } from '../../common/protocol';
import {
  AppInfo,
  appInfoPropertyLiterals,
  CHANNEL_PLOTTER_WINDOW_DID_CLOSE,
  CHANNEL_SCHEDULE_DELETION,
  CHANNEL_SHOW_PLOTTER_WINDOW,
  isShowPlotterWindowParams,
} from '../../electron-common/electron-arduino';
import { IsTempSketch } from '../../node/is-temp-sketch';
import { isAccessibleSketchPath } from '../../node/sketches-service-impl';
import { ErrnoException } from '../../node/utils/errors';

app.commandLine.appendSwitch('disable-http-cache');

const consoleLogFunctionNames = [
  'log',
  'trace',
  'debug',
  'info',
  'warn',
  'error',
] as const;
type ConsoleLogSeverity = (typeof consoleLogFunctionNames)[number];
interface ConsoleLogParams {
  readonly severity: ConsoleLogSeverity;
  readonly message: string;
}
function isConsoleLogParams(arg: unknown): arg is ConsoleLogParams {
  return (
    isObject<ConsoleLogParams>(arg) &&
    typeof arg.message === 'string' &&
    typeof arg.severity === 'string' &&
    consoleLogFunctionNames.includes(arg.severity as ConsoleLogSeverity)
  );
}

// Patch for on Linux when `XDG_CONFIG_HOME` is not available, `node-log-rotate` creates the folder with `undefined` name.
// See https://github.com/lemon-sour/node-log-rotate/issues/23 and https://github.com/arduino/arduino-ide/issues/394.
// If the IDE2 is running on Linux, and the `XDG_CONFIG_HOME` variable is not available, set it to avoid the `undefined` folder.
// From the specs: https://specifications.freedesktop.org/basedir-spec/latest/ar01s03.html
// "If $XDG_CONFIG_HOME is either not set or empty, a default equal to $HOME/.config should be used."
function enableFileLogger() {
  const os = require('os');
  const util = require('util');
  if (os.platform() === 'linux' && !process.env['XDG_CONFIG_HOME']) {
    const { join } = require('path');
    const home = process.env['HOME'];
    const xdgConfigHome = home
      ? join(home, '.config')
      : join(os.homedir(), '.config');
    process.env['XDG_CONFIG_HOME'] = xdgConfigHome;
  }
  setupFileLog({
    appName: 'Arduino IDE',
    maxSize: 10 * 1024 * 1024,
  });
  for (const name of consoleLogFunctionNames) {
    const original = console[name];
    console[name] = function () {
      // eslint-disable-next-line prefer-rest-params
      const messages = Object.values(arguments);
      const message = util.format(...messages);
      original(message);
      logToFile(message);
    };
  }
}

const isProductionMode = !environment.electron.isDevMode();
if (isProductionMode) {
  enableFileLogger();
}

interface WorkspaceOptions {
  file: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
  time: number;
}

const WORKSPACES = 'workspaces';

/**
 * If the app is started with `--open-devtools` argument, the `Dev Tools` will be opened.
 */
const APP_STARTED_WITH_DEV_TOOLS =
  typeof process !== 'undefined' &&
  process.argv.indexOf('--open-devtools') !== -1;

/**
 * If the app is started with `--content-trace` argument, the `Dev Tools` will be opened and content tracing will start.
 */
const APP_STARTED_WITH_CONTENT_TRACE =
  typeof process !== 'undefined' &&
  process.argv.indexOf('--content-trace') !== -1;

@injectable()
export class ElectronMainApplication extends TheiaElectronMainApplication {
  @inject(IsTempSketch)
  private readonly isTempSketch: IsTempSketch;
  private startup = false;
  private _firstWindowId: number | undefined;
  private _appInfo: AppInfo = {
    appVersion: '',
    cliVersion: '',
    buildDate: '',
  };
  private openFilePromise = new Deferred();
  /**
   * It contains all things the IDE2 must clean up before a normal stop.
   *
   * When deleting the sketch, the IDE2 must close the browser window and
   * recursively delete the sketch folder from the filesystem. The sketch
   * cannot be deleted when the window is open because that is the currently
   * opened workspace. IDE2 cannot delete the sketch folder from the
   * filesystem after closing the browser window because the window can be
   * the last, and when the last window closes, the application quits.
   * There is no way to clean up the undesired resources.
   *
   * This array contains disposable instances wrapping synchronous sketch
   * delete operations. When IDE2 closes the browser window, it schedules
   * the sketch deletion, and the window closes.
   *
   * When IDE2 schedules a sketch for deletion, it creates a synchronous
   * folder deletion as a disposable instance and pushes it into this
   * array. After the push, IDE2 starts the sketch deletion in an
   * asynchronous way. When the deletion completes, the disposable is
   * removed. If the app quits when the asynchronous deletion is still in
   * progress, it disposes the elements of this array. Since it is
   * synchronous, it is [ensured by Theia](https://github.com/eclipse-theia/theia/blob/678e335644f1b38cb27522cc27a3b8209293cf31/packages/core/src/node/backend-application.ts#L91-L97)
   * that IDE2 won't quit before the cleanup is done. It works only in normal
   * quit.
   */
  // TODO: Why is it here and not in the Theia backend?
  // https://github.com/eclipse-theia/theia/discussions/12135
  private readonly scheduledDeletions: Disposable[] = [];

  override async start(config: FrontendApplicationConfig): Promise<void> {
    // Explicitly set the app name to have better menu items on macOS. ("About", "Hide", and "Quit")
    // See: https://github.com/electron-userland/electron-builder/issues/2468
    // Regression in Theia: https://github.com/eclipse-theia/theia/issues/8701
    console.log(`${config.applicationName} ${app.getVersion()}`);
    app.on('ready', () => app.setName(config.applicationName));
    const cwd = process.cwd();
    this.attachFileAssociations(cwd);
    this.useNativeWindowFrame = this.getTitleBarStyle(config) === 'native';
    this._config = await updateFrontendApplicationConfigFromPackageJson(config);
    this._appInfo = updateAppInfo(this._appInfo, this._config);
    this.hookApplicationEvents();
    const [port] = await Promise.all([this.startBackend(), app.whenReady()]);
    this.startContentTracing();
    this._backendPort.resolve(port);
    await Promise.all([
      this.attachElectronSecurityToken(port),
      this.startContributions(),
    ]);
    return this.launch({
      secondInstance: false,
      argv: this.processArgv.getProcessArgvWithoutBin(process.argv),
      cwd,
    });
  }

  private startContentTracing(): void {
    if (!APP_STARTED_WITH_CONTENT_TRACE) {
      return;
    }
    if (!app.isReady()) {
      throw new Error(
        'Cannot start content tracing when the electron app is not ready.'
      );
    }
    const defaultTraceCategories: Readonly<Array<string>> = [
      '-*',
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
      'toplevel',
      'blink.console',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profile',
      'disabled-by-default-v8.cpu_profiler',
      'disabled-by-default-v8.cpu_profiler.hires',
    ];
    const traceOptions = {
      categoryFilter: defaultTraceCategories.join(','),
      traceOptions: 'record-until-full',
      options: 'sampling-frequency=10000',
    };
    (async () => {
      const appPath = app.getAppPath();
      let traceFile: string | undefined;
      if (appPath) {
        const tracesPath = join(appPath, 'traces');
        await fs.mkdir(tracesPath, { recursive: true });
        traceFile = join(tracesPath, `trace-${new Date().toISOString()}.trace`);
      }
      console.log('>>> Content tracing has started...');
      await contentTracing.startRecording(traceOptions);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      contentTracing
        .stopRecording(traceFile)
        .then((out) =>
          console.log(
            `<<< Content tracing has finished. The trace data was written to: ${out}.`
          )
        );
    })();
  }

  private attachFileAssociations(cwd: string): void {
    // OSX: register open-file event
    if (isOSX) {
      app.on('open-file', async (event, path) => {
        event.preventDefault();
        const resolvedPath = await this.resolvePath(path, cwd);
        if (resolvedPath) {
          const sketchFolderPath = await isAccessibleSketchPath(
            resolvedPath,
            true
          );
          if (sketchFolderPath) {
            this.openFilePromise.reject(new InterruptWorkspaceRestoreError());
            await this.openSketch(sketchFolderPath);
          }
        }
      });
      setTimeout(() => this.openFilePromise.resolve(), 500);
    } else {
      this.openFilePromise.resolve();
    }
  }

  private async resolvePath(
    maybePath: string,
    cwd: string
  ): Promise<string | undefined> {
    if (isAbsolute(maybePath)) {
      return maybePath;
    }
    try {
      const resolved = await fs.realpath(resolve(cwd, maybePath));
      return resolved;
    } catch (err) {
      if (ErrnoException.isENOENT(err)) {
        return undefined;
      }
      throw err;
    }
  }

  protected override async launch(
    params: ElectronMainExecutionParams
  ): Promise<void> {
    try {
      // When running on MacOS, we either have to wait until
      // 1. The `open-file` command has been received by the app, rejecting the promise
      // 2. A short timeout resolves the promise automatically, falling back to the usual app launch
      await this.openFilePromise.promise;
    } catch (err) {
      if (err instanceof InterruptWorkspaceRestoreError) {
        // Application has received the `open-file` event and will skip the default application launch
        return;
      }
      throw err;
    }

    if (await this.launchFromArgs(params)) {
      // Application has received a file in its arguments and will skip the default application launch
      return;
    }

    this.startup = true;
    const workspaces: WorkspaceOptions[] | undefined =
      this.electronStore.get(WORKSPACES);
    let useDefault = true;
    if (workspaces && workspaces.length > 0) {
      console.log(
        `Restoring workspace roots: ${workspaces.map(({ file }) => file)}`
      );
      for (const workspace of workspaces) {
        const resolvedPath = await this.resolvePath(workspace.file, params.cwd);
        if (!resolvedPath) {
          continue;
        }
        const sketchFolderPath = await isAccessibleSketchPath(
          resolvedPath,
          true
        );
        if (sketchFolderPath) {
          workspace.file = sketchFolderPath;
          if (this.isTempSketch.is(workspace.file)) {
            console.info(
              `Skipped opening sketch. The sketch was detected as temporary. Workspace path: ${workspace.file}.`
            );
            continue;
          }
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

  private async launchFromArgs(
    params: ElectronMainExecutionParams
  ): Promise<boolean> {
    // Copy to prevent manipulation of original array
    const argCopy = [...params.argv];
    let path: string | undefined;
    for (const maybePath of argCopy) {
      const resolvedPath = await this.resolvePath(maybePath, params.cwd);
      if (!resolvedPath) {
        continue;
      }
      const sketchFolderPath = await isAccessibleSketchPath(resolvedPath, true);
      if (sketchFolderPath) {
        path = sketchFolderPath;
        break;
      }
    }
    if (path) {
      await this.openSketch(path);
      return true;
    }
    return false;
  }

  private async openSketch(
    workspaceOrPath: WorkspaceOptions | string
  ): Promise<BrowserWindow> {
    const options = await this.getLastWindowOptions();
    let file: string;
    if (typeof workspaceOrPath === 'object') {
      options.x = workspaceOrPath.x;
      options.y = workspaceOrPath.y;
      options.width = workspaceOrPath.width;
      options.height = workspaceOrPath.height;
      options.isMaximized = workspaceOrPath.isMaximized;
      options.isFullScreen = workspaceOrPath.isFullScreen;
      file = workspaceOrPath.file;
    } else {
      file = workspaceOrPath;
    }
    options.frame = false;
    const [uri, electronWindow] = await Promise.all([
      this.createWindowUri(),
      this.createWindow(options),
    ]);
    electronWindow.loadURL(uri.withFragment(encodeURI(file)).toString(true));
    return electronWindow;
  }

  protected override avoidOverlap(
    options: TheiaBrowserWindowOptions
  ): TheiaBrowserWindowOptions {
    if (this.startup) {
      return options;
    }
    return super.avoidOverlap(options);
  }

  protected override getTitleBarStyle(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _config: FrontendApplicationConfig
  ): 'native' | 'custom' {
    return 'native';
  }

  protected override hookApplicationEvents(): void {
    app.on('will-quit', this.onWillQuit.bind(this));
    app.on('second-instance', this.onSecondInstance.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    ipcMain.on(CHANNEL_SCHEDULE_DELETION, (event, sketch: unknown) => {
      if (Sketch.is(sketch)) {
        console.log(`Sketch ${sketch.uri} was scheduled for deletion`);
        // TODO: remove deleted sketch from closedWorkspaces?
        this.delete(sketch);
      }
    });
    ipcMain.on(CHANNEL_SHOW_PLOTTER_WINDOW, (event, args) =>
      this.handleShowPlotterWindow(event, args)
    );
  }

  // keys are the host window IDs
  private readonly plotterWindows = new Map<number, BrowserWindow>();
  private handleShowPlotterWindow(
    event: Electron.IpcMainEvent,
    args: unknown
  ): void {
    if (!isShowPlotterWindowParams(args)) {
      console.warn(
        `Received unexpected params on the '${CHANNEL_SHOW_PLOTTER_WINDOW}' channel. Sender ID: ${event.sender.id
        }, params: ${JSON.stringify(args)}`
      );
      return;
    }
    const electronWindow = BrowserWindow.fromWebContents(event.sender);
    if (!electronWindow) {
      console.warn(
        `Could not find the host window of event received on the '${CHANNEL_SHOW_PLOTTER_WINDOW}' channel. Sender ID: ${event.sender.id
        }, params: ${JSON.stringify(args)}`
      );
      return;
    }

    const windowId = electronWindow.id;
    let plotterWindow = this.plotterWindows.get(windowId);
    if (plotterWindow) {
      if (!args.forceReload) {
        plotterWindow.focus();
      } else {
        plotterWindow.loadURL(args.url);
      }
      return;
    }

    // 创建一个新的BrowserWindow对象，用于显示绘图窗口
    plotterWindow = new BrowserWindow({
      width: 800,
      minWidth: 620,
      height: 500,
      minHeight: 320,
      x: 100,
      y: 100,
      webPreferences: <Electron.WebPreferences>{
        devTools: true,
        nativeWindowOpen: true,
        openerId: electronWindow.webContents.id,
      },
    });
    // plotterWindow.webContents.openDevTools();
    // this.attachListenersToWindow(plotterWindow);
    this.plotterWindows.set(windowId, plotterWindow);
    plotterWindow.setMenu(null);
    plotterWindow.on('closed', () => {
      this.plotterWindows.delete(windowId);
      electronWindow.webContents.send(CHANNEL_PLOTTER_WINDOW_DID_CLOSE);
    });
    plotterWindow.loadURL(args.url);
  }

  protected override async onSecondInstance(
    event: ElectronEvent,
    argv: string[],
    cwd: string
  ): Promise<void> {
    if (await this.launchFromArgs({ cwd, argv, secondInstance: true })) {
      // Application has received a file in its arguments
      return;
    }
    super.onSecondInstance(event, argv, cwd);
  }

  override async createWindow(
    asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultTheiaWindowOptions()
  ): Promise<BrowserWindow> {
    asyncOptions = await asyncOptions;
    asyncOptions.frame = false;
    const electronWindow = await super.createWindow(asyncOptions);
    if (APP_STARTED_WITH_DEV_TOOLS) {
      electronWindow.webContents.openDevTools();
    }
    this.attachListenersToWindow(electronWindow);
    if (this._firstWindowId === undefined) {
      this._firstWindowId = electronWindow.id;
    }
    return electronWindow;
  }

  protected override getDefaultOptions(): TheiaBrowserWindowOptions {
    const options = super.getDefaultOptions();
    if (!options.webPreferences) {
      options.webPreferences = {};
    }
    options.webPreferences.v8CacheOptions = 'bypassHeatCheck'; // TODO: verify this. VS Code use this V8 option.
    options.minWidth = 680;
    options.minHeight = 593;
    options.frame = false;
    return options;
  }

  private attachListenersToWindow(electronWindow: BrowserWindow) {
    this.attachClosedWorkspace(electronWindow);
    this.attachClosePlotterWindow(electronWindow);
  }

  protected override async startBackend(): Promise<number> {
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
        // The forked backend process sends the resolved http(s) server port via IPC, and forwards the log messages.
        backendProcess.on('message', (arg: unknown) => {
          if (isConsoleLogParams(arg)) {
            const { message, severity } = arg;
            console[severity](message);
          } else if (isAddressInfo(arg)) {
            resolve(arg.port);
          }
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

  private closedWorkspaces: WorkspaceOptions[] = [];

  private attachClosedWorkspace(window: BrowserWindow): void {
    // Since the `before-quit` event is only fired when closing the *last* window
    // We need to keep track of recently closed windows/workspaces manually
    window.on('close', () => {
      const url = window.webContents.getURL();
      const workspace = URI.parse(url).fragment;
      if (workspace) {
        const workspaceUri = URI.file(workspace);
        const bounds = window.getNormalBounds();
        const now = Date.now();
        // Do not try to reopen the sketch if it was temp.
        // Unfortunately, IDE2 has two different logic of restoring recent sketches: the Theia default `recentworkspace.json` and there is the `recent-sketches.json`.
        const file = workspaceUri.fsPath;
        if (this.isTempSketch.is(file)) {
          console.info(
            `Ignored marking workspace as a closed sketch. The sketch was detected as temporary. Workspace URI: ${workspaceUri.toString()}.`
          );
          return;
        }
        console.log(
          `Marking workspace as a closed sketch. Workspace URI: ${workspaceUri.toString()}. Date: ${now}.`
        );
        this.closedWorkspaces.push({
          ...bounds,
          isMaximized: window.isMaximized(),
          isFullScreen: window.isFullScreen(),
          file: workspaceUri.fsPath,
          time: now,
        });
      }
    });
  }

  private attachClosePlotterWindow(window: BrowserWindow): void {
    window.on('close', () => {
      this.plotterWindows.get(window.id)?.close();
      this.plotterWindows.delete(window.id);
    });
  }

  protected override onWillQuit(event: Electron.Event): void {
    // Only add workspaces which were closed within the last second (1000 milliseconds)
    const threshold = Date.now() - 1000;
    const visited = new Set<string>();
    const workspaces = this.closedWorkspaces
      .filter((e) => {
        if (e.time < threshold) {
          console.log(
            `Skipped storing sketch as workspace root. Expected minimum threshold: <${threshold}>. Was: <${e.time}>.`
          );
          return false;
        }
        if (visited.has(e.file)) {
          console.log(
            `Skipped storing sketch as workspace root. Already visited: <${e.file}>.`
          );
          return false;
        }
        visited.add(e.file);
        console.log(`Storing the sketch as a workspace root: <${e.file}>.`);
        return true;
      })
      .sort((a, b) => a.file.localeCompare(b.file));
    this.electronStore.set(WORKSPACES, workspaces);
    console.log(
      `Stored workspaces roots: ${workspaces.map(({ file }) => file)}`
    );

    if (this.scheduledDeletions.length) {
      console.log(
        '>>> Finishing scheduled sketch deletions before app quit...'
      );
      new DisposableCollection(...this.scheduledDeletions).dispose();
      console.log('<<< Successfully finishing scheduled sketch deletions.');
    } else {
      console.log('No sketches were scheduled for deletion.');
    }

    if (this.plotterWindows.size) {
      for (const [
        hostWindowId,
        plotterWindow,
      ] of this.plotterWindows.entries()) {
        plotterWindow.close();
        this.plotterWindows.delete(hostWindowId);
      }
    }

    super.onWillQuit(event);
  }

  get browserWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).map(({ window }) => window);
  }

  get firstWindowId(): number | undefined {
    return this._firstWindowId;
  }

  get appInfo(): AppInfo {
    return this._appInfo;
  }

  private async delete(sketch: Sketch): Promise<void> {
    const sketchPath = FileUri.fsPath(sketch.uri);
    const disposable = Disposable.create(() => {
      try {
        this.deleteSync(sketchPath);
      } catch (err) {
        console.error(
          `Could not delete sketch ${sketchPath} on app quit.`,
          err
        );
      }
    });
    this.scheduledDeletions.push(disposable);
    return new Promise<void>((resolve, reject) => {
      rm(sketchPath, { recursive: true, maxRetries: 5 }, (error) => {
        if (error) {
          console.error(`Failed to delete sketch ${sketchPath}`, error);
          reject(error);
        } else {
          console.info(`Successfully deleted sketch ${sketchPath}`);
          resolve();
          const index = this.scheduledDeletions.indexOf(disposable);
          if (index >= 0) {
            this.scheduledDeletions.splice(index, 1);
            console.info(
              `Successfully completed the scheduled sketch deletion: ${sketchPath}`
            );
          } else {
            console.warn(
              `Could not find the scheduled sketch deletion: ${sketchPath}`
            );
          }
        }
      });
    });
  }

  private deleteSync(sketchPath: string): void {
    console.info(
      `>>> Running sketch deletion ${sketchPath} before app quit...`
    );
    try {
      rmSync(sketchPath, { recursive: true, maxRetries: 5 });
      console.info(`<<< Deleted sketch ${sketchPath}`);
    } catch (err) {
      if (!ErrnoException.isENOENT(err)) {
        throw err;
      } else {
        console.info(`<<< Sketch ${sketchPath} did not exist.`);
      }
    }
  }

  // Fallback app config when starting IDE2 from an ino file (from Explorer, Finder, etc.) and the app config is not yet set.
  // https://github.com/arduino/arduino-ide/issues/2209
  private _fallbackConfig: FrontendApplicationConfig | undefined;
  override get config(): FrontendApplicationConfig {
    if (!this._config) {
      if (!this._fallbackConfig) {
        this._fallbackConfig = readFrontendAppConfigSync();
      }
      return this._fallbackConfig;
    }
    return super.config;
  }
}

class InterruptWorkspaceRestoreError extends Error {
  constructor() {
    super(
      "Received 'open-file' event. Interrupting the default launch workflow."
    );
    Object.setPrototypeOf(this, InterruptWorkspaceRestoreError.prototype);
  }
}

// This is a workaround for a limitation with the Theia CLI and `electron-builder`.
// It is possible to run the `electron-builder` with `-c.extraMetadata.foo.bar=36` option.
// On the fly, a `package.json` file will be generated for the final bundled application with the additional `{ "foo": { "bar": 36 } }` metadata.
// The Theia build (via the CLI) requires the extra `foo.bar=36` metadata to be in the `package.json` at build time (before `electron-builder` time).
// See the generated `./electron-app/src-gen/backend/electron-main.js` and how this works.
// This method merges in any additional required properties defined in the current! `package.json` of the application. For example, the `buildDate`.
// The current package.json is the package.json of the `electron-app` if running from the source code,
// but it's the `package.json` inside the `resources/app/` folder if it's the final bundled app.
// See https://github.com/arduino/arduino-ide/pull/2144#pullrequestreview-1556343430.
async function updateFrontendApplicationConfigFromPackageJson(
  config: FrontendApplicationConfig
): Promise<FrontendApplicationConfig> {
  if (!isProductionMode) {
    console.debug(
      'Skipping frontend application configuration customizations. Running in dev mode.'
    );
    return config;
  }
  try {
    console.debug(
      `Checking for frontend application configuration customizations. Module path: ${__filename}, destination 'package.json': ${packageJsonPath}`
    );
    const rawPackageJson = await fs.readFile(packageJsonPath, {
      encoding: 'utf8',
    });
    const packageJson = JSON.parse(rawPackageJson);
    if (packageJson?.theia?.frontend?.config) {
      const packageJsonConfig: Record<string, string> =
        packageJson?.theia?.frontend?.config;
      for (const property of appInfoPropertyLiterals) {
        const value = packageJsonConfig[property];
        if (value && !config[property]) {
          if (!config[property]) {
            console.debug(
              `Setting 'theia.frontend.config.${property}' application configuration value to: ${JSON.stringify(
                value
              )} (type of ${typeof value})`
            );
          } else {
            console.warn(
              `Overriding 'theia.frontend.config.${property}' application configuration value with: ${JSON.stringify(
                value
              )} (type of ${typeof value}). Original value: ${JSON.stringify(
                config[property]
              )}`
            );
          }
          config[property] = value;
        }
      }
      console.debug(
        `Frontend application configuration after modifications: ${JSON.stringify(
          config
        )}`
      );
      return config;
    }
  } catch (err) {
    console.error(
      `Could not read the frontend application configuration from the 'package.json' file. Falling back to (the Theia CLI) generated default config: ${JSON.stringify(
        config
      )}`,
      err
    );
  }
  return config;
}

const fallbackFrontendAppConfig: FrontendApplicationConfig = {
  applicationName: 'Arduino IDE',
  defaultTheme: {
    light: 'arduino-theme',
    dark: 'arduino-theme-dark',
  },
  defaultIconTheme: 'none',
  validatePreferencesSchema: false,
  defaultLocale: '',
  electron: {},
};

// When the package.json must go from `./lib/backend/electron-main.js` to `./package.json` when the app is webpacked.
// Only for production mode!
const packageJsonPath = join(__filename, '..', '..', '..', 'package.json');

function readFrontendAppConfigSync(): FrontendApplicationConfig {
  if (environment.electron.isDevMode()) {
    console.debug(
      'Running in dev mode. Using the fallback fronted application config.'
    );
    return fallbackFrontendAppConfig;
  }
  try {
    const raw = readFileSync(packageJsonPath, { encoding: 'utf8' });
    const packageJson = JSON.parse(raw);
    const config = packageJson?.theia?.frontend?.config;
    if (config) {
      return config;
    }
    throw new Error(`Frontend application config not found. ${packageJson}`);
  } catch (err) {
    console.error(
      `Could not read package.json content from ${packageJsonPath}.`,
      err
    );
    return fallbackFrontendAppConfig;
  }
}

/**
 * Mutates the `toUpdate` argument and returns with it.
 */
function updateAppInfo(
  toUpdate: Mutable<AppInfo>,
  updateWith: Record<string, unknown>
): AppInfo {
  appInfoPropertyLiterals.forEach((property) => {
    const newValue = updateWith[property];
    if (typeof newValue === 'string') {
      toUpdate[property] = newValue;
    }
  });
  return toUpdate;
}

function isAddressInfo(arg: unknown): arg is Pick<AddressInfo, 'port'> {
  // Cannot do the type-guard on all properties, but the port is sufficient as the address is always `localhost`.
  // For example, the `family` might be absent if the address is IPv6.
  return isObject<AddressInfo>(arg) && typeof arg.port === 'number';
}
