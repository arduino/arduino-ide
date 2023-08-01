import {
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainEvent,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from '@theia/core/electron-shared/electron';
import { Disposable } from '@theia/core/lib/common/disposable';
import { isOSX } from '@theia/core/lib/common/os';
import { CHANNEL_REQUEST_RELOAD } from '@theia/core/lib/electron-common/electron-api';
import {
  ElectronMainApplication as TheiaElectronMainApplication,
  ElectronMainApplicationContribution,
} from '@theia/core/lib/electron-main/electron-main-application';
import { createDisposableListener } from '@theia/core/lib/electron-main/event-utils';
import { injectable } from '@theia/core/shared/inversify';
import { WebContents } from '@theia/electron/shared/electron';
import {
  AppInfo,
  CHANNEL_APP_INFO,
  CHANNEL_IS_FIRST_WINDOW,
  CHANNEL_MAIN_MENU_ITEM_DID_CLICK,
  CHANNEL_OPEN_PATH,
  CHANNEL_QUIT_APP,
  CHANNEL_SEND_STARTUP_TASKS,
  CHANNEL_SET_MENU_WITH_NODE_ID,
  CHANNEL_SET_REPRESENTED_FILENAME,
  CHANNEL_SHOW_MESSAGE_BOX,
  CHANNEL_SHOW_OPEN_DIALOG,
  CHANNEL_SHOW_SAVE_DIALOG,
  InternalMenuDto,
  MessageBoxOptions,
  MessageBoxReturnValue,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from '../electron-common/electron-arduino';
import { StartupTasks } from '../electron-common/startup-task';
import { ElectronMainApplication } from './theia/electron-main-application';

@injectable()
export class ElectronArduino implements ElectronMainApplicationContribution {
  onStart(app: TheiaElectronMainApplication): void {
    if (!(app instanceof ElectronMainApplication)) {
      throw new Error('Illegal binding for the electron main application.');
    }
    ipcMain.handle(
      CHANNEL_SHOW_MESSAGE_BOX,
      async (event, options: MessageBoxOptions) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        let result: MessageBoxReturnValue;
        if (window) {
          result = await dialog.showMessageBox(window, options);
        } else {
          result = await dialog.showMessageBox(options);
        }
        return result;
      }
    );
    ipcMain.handle(
      CHANNEL_SHOW_OPEN_DIALOG,
      async (event, options: OpenDialogOptions) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        let result: OpenDialogReturnValue;
        if (window) {
          result = await dialog.showOpenDialog(window, options);
        } else {
          result = await dialog.showOpenDialog(options);
        }
        return result;
      }
    );
    ipcMain.handle(
      CHANNEL_SHOW_SAVE_DIALOG,
      async (event, options: SaveDialogOptions) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        let result: SaveDialogReturnValue;
        if (window) {
          result = await dialog.showSaveDialog(window, options);
        } else {
          result = await dialog.showSaveDialog(options);
        }
        return result;
      }
    );
    ipcMain.handle(CHANNEL_APP_INFO, async (): Promise<AppInfo> => {
      return app.appInfo;
    });
    ipcMain.on(CHANNEL_QUIT_APP, () => app.requestStop());
    ipcMain.handle(CHANNEL_IS_FIRST_WINDOW, async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return false;
      }
      return app.firstWindowId === window.id;
    });
    ipcMain.on(CHANNEL_SET_REPRESENTED_FILENAME, (event, fsPath: string) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setRepresentedFilename(fsPath);
      }
    });
    ipcMain.on(CHANNEL_OPEN_PATH, (_, fsPath: string) => {
      shell.openPath(fsPath);
    });
    ipcMain.on(
      CHANNEL_SET_MENU_WITH_NODE_ID,
      (event, internalMenu: InternalMenuDto[] | undefined) => {
        const electronMenu = internalMenu
          ? Menu.buildFromTemplate(fromMenuDto(event.sender, internalMenu))
          : null;
        if (isOSX) {
          Menu.setApplicationMenu(electronMenu);
        } else {
          const window = BrowserWindow.fromWebContents(event.sender);
          if (!window) {
            console.warn(
              `Failed to set the application menu. Could not find the browser window from the webContents. Sender ID: ${event.sender.id}`
            );
            return;
          }
          window.setMenu(electronMenu);
        }
      }
    );
  }
}

function fromMenuDto(
  sender: WebContents,
  menuDto: InternalMenuDto[]
): MenuItemConstructorOptions[] {
  return menuDto.map((dto) => {
    const result: MenuItemConstructorOptions = {
      id: dto.id,
      label: dto.label,
      type: dto.type,
      checked: dto.checked,
      enabled: dto.enabled,
      visible: dto.visible,
      role: dto.role,
      accelerator: dto.accelerator,
    };
    if (dto.submenu) {
      result.submenu = fromMenuDto(sender, dto.submenu);
    }
    if (dto.nodeId) {
      result.click = () => {
        sender.send(CHANNEL_MAIN_MENU_ITEM_DID_CLICK, dto.nodeId);
      };
    }
    return result;
  });
}

export namespace ElectronArduinoRenderer {
  export function sendStartupTasks(
    webContents: WebContents,
    tasks: StartupTasks
  ): void {
    webContents.send(CHANNEL_SEND_STARTUP_TASKS, tasks);
  }

  // Same as Theia's `onRequestReload` but can accept an arg from the renderer.
  export function onRequestReload(
    wc: WebContents,
    handler: (arg?: unknown) => void
  ): Disposable {
    return createWindowListener(wc, CHANNEL_REQUEST_RELOAD, handler);
  }

  function createWindowListener(
    webContents: WebContents,
    channel: string,
    handler: (...args: unknown[]) => unknown
  ): Disposable {
    return createDisposableListener<IpcMainEvent>(
      ipcMain,
      channel,
      (event, ...args) => {
        if (webContents.id === event.sender.id) {
          handler(...args);
        }
      }
    );
  }
}
