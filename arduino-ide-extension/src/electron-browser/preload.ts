import {
  contextBridge,
  ipcRenderer,
} from '@theia/core/electron-shared/electron';
import { Disposable } from '@theia/core/lib/common/disposable';
import { CHANNEL_REQUEST_RELOAD } from '@theia/core/lib/electron-common/electron-api';
import type { Sketch } from '../common/protocol/sketches-service';
import {
  CHANNEL_APP_VERSION,
  CHANNEL_IS_FIRST_WINDOW,
  CHANNEL_PLOTTER_WINDOW_DID_CLOSE,
  CHANNEL_QUIT_APP,
  CHANNEL_SCHEDULE_DELETION,
  CHANNEL_SEND_STARTUP_TASKS,
  CHANNEL_SET_REPRESENTED_FILENAME,
  CHANNEL_SHOW_MESSAGE_BOX,
  CHANNEL_SHOW_OPEN_DIALOG,
  CHANNEL_SHOW_PLOTTER_WINDOW,
  CHANNEL_SHOW_SAVE_DIALOG,
  ElectronArduino,
  MessageBoxOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from '../electron-common/electron-arduino';
import { hasStartupTasks, StartupTasks } from '../electron-common/startup-task';

const api: ElectronArduino = {
  showMessageBox: (options: MessageBoxOptions) =>
    ipcRenderer.invoke(CHANNEL_SHOW_MESSAGE_BOX, options),
  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke(CHANNEL_SHOW_OPEN_DIALOG, options),
  showSaveDialog: (options: SaveDialogOptions) =>
    ipcRenderer.invoke(CHANNEL_SHOW_SAVE_DIALOG, options),
  appVersion: () => ipcRenderer.invoke(CHANNEL_APP_VERSION),
  quitApp: () => ipcRenderer.send(CHANNEL_QUIT_APP),
  isFirstWindow: () => ipcRenderer.invoke(CHANNEL_IS_FIRST_WINDOW),
  requestReload: (options: StartupTasks) =>
    ipcRenderer.send(CHANNEL_REQUEST_RELOAD, options),
  registerStartupTasksHandler: (handler: (tasks: StartupTasks) => void) => {
    const listener = (_: Electron.IpcRendererEvent, args: unknown) => {
      if (hasStartupTasks(args)) {
        handler(args);
      } else {
        console.warn(
          `Events received on the ${CHANNEL_SEND_STARTUP_TASKS} channel expected to have a startup task argument, but it was: ${JSON.stringify(
            args
          )}`
        );
      }
    };
    ipcRenderer.on(CHANNEL_SEND_STARTUP_TASKS, listener);
    return Disposable.create(() =>
      ipcRenderer.removeListener(CHANNEL_SEND_STARTUP_TASKS, listener)
    );
  },
  scheduleDeletion: (sketch: Sketch) =>
    ipcRenderer.send(CHANNEL_SCHEDULE_DELETION, sketch),
  setRepresentedFilename: (fsPath: string) =>
    ipcRenderer.send(CHANNEL_SET_REPRESENTED_FILENAME, fsPath),
  showPlotterWindow: (params: { url: string; forceReload?: boolean }) =>
    ipcRenderer.send(CHANNEL_SHOW_PLOTTER_WINDOW, params),
  registerPlotterWindowCloseHandler: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on(CHANNEL_PLOTTER_WINDOW_DID_CLOSE, listener);
    return Disposable.create(() =>
      ipcRenderer.removeListener(CHANNEL_PLOTTER_WINDOW_DID_CLOSE, listener)
    );
  },
};

export function preload(): void {
  contextBridge.exposeInMainWorld('electronArduino', api);
  console.log('Exposed Arduino IDE electron API');
}
