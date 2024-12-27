import { isOSX, MaybePromise } from '@theia/core';
import * as nativeKeymap from '@theia/electron/shared/native-keymap';
import {
  CHANNEL_ATTACH_SECURITY_TOKEN,
  CHANNEL_CLOSE,
  CHANNEL_CLOSE_POPUP,
  CHANNEL_FOCUS_WINDOW,
  CHANNEL_GET_SECURITY_TOKEN,
  CHANNEL_GET_TITLE_STYLE_AT_STARTUP,
  CHANNEL_GET_ZOOM_LEVEL,
  CHANNEL_INVOKE_MENU,
  CHANNEL_IS_FULL_SCREEN,
  CHANNEL_IS_FULL_SCREENABLE,
  CHANNEL_IS_MAXIMIZED,
  CHANNEL_MAXIMIZE,
  CHANNEL_MINIMIZE,
  CHANNEL_ON_CLOSE_POPUP,
  CHANNEL_OPEN_POPUP,
  CHANNEL_READ_CLIPBOARD,
  CHANNEL_RESTART,
  CHANNEL_SET_MENU,
  CHANNEL_SET_MENU_BAR_VISIBLE,
  CHANNEL_SET_TITLE_STYLE,
  CHANNEL_SET_ZOOM_LEVEL,
  CHANNEL_SHOW_ITEM_IN_FOLDER,
  CHANNEL_TOGGLE_DEVTOOLS,
  CHANNEL_TOGGLE_FULL_SCREEN,
  CHANNEL_UNMAXIMIZE,
  CHANNEL_WRITE_CLIPBOARD,
  InternalMenuDto,
  MenuDto,
} from '@theia/core/lib/electron-common/electron-api';
import { ElectronSecurityToken } from '@theia/core/lib/electron-common/electron-token';
import { TheiaMainApi } from '@theia/core/lib/electron-main/electron-api-main';
import { ElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { injectable } from '@theia/core/shared/inversify';
import {
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  session,
  shell,
  webContents,
} from '@theia/electron/shared/electron';

@injectable()
export class TheiaMainApiFixFalsyHandlerId extends TheiaMainApi {
  override onStart(application: ElectronMainApplication): MaybePromise<void> {
    ipcMain.on(CHANNEL_GET_SECURITY_TOKEN, (event) => {
      event.returnValue = this.electronSecurityToken.value;
    });

    ipcMain.handle(CHANNEL_ATTACH_SECURITY_TOKEN, (event, endpoint) =>
      session.defaultSession.cookies.set({
        url: endpoint,
        name: ElectronSecurityToken,
        value: JSON.stringify(this.electronSecurityToken),
        httpOnly: true,
        sameSite: 'no_restriction',
      })
    );

    // application menu
    ipcMain.on(CHANNEL_SET_MENU, (event, menuId: number, menu: MenuDto[]) => {
      let electronMenu: Menu | null;
      if (menu) {
        electronMenu = Menu.buildFromTemplate(
          this.fromMenuDto(event.sender, menuId, menu)
        );
      } else {
        electronMenu = null;
      }
      if (isOSX) {
        Menu.setApplicationMenu(electronMenu);
      } else {
        BrowserWindow.fromWebContents(event.sender)?.setMenu(electronMenu);
      }
    });

    ipcMain.on(
      CHANNEL_SET_MENU_BAR_VISIBLE,
      (event, visible: boolean, windowName: string | undefined) => {
        let electronWindow;
        if (windowName) {
          electronWindow = BrowserWindow.getAllWindows().find(
            (win) => win.webContents.mainFrame.name === windowName
          );
        } else {
          electronWindow = BrowserWindow.fromWebContents(event.sender);
        }
        if (electronWindow) {
          electronWindow.setMenuBarVisibility(visible);
        } else {
          console.warn(
            `There is no known secondary window '${windowName}'. Thus, the menu bar could not be made visible.`
          );
        }
      }
    );

    // popup menu
    ipcMain.handle(CHANNEL_OPEN_POPUP, (event, menuId, menu, x, y) => {
      const zoom = event.sender.getZoomFactor();
      // TODO: Remove the offset once Electron fixes https://github.com/electron/electron/issues/31641
      const offset = process.platform === 'win32' ? 0 : 2;
      // x and y values must be Ints or else there is a conversion error
      x = Math.round(x * zoom) + offset;
      y = Math.round(y * zoom) + offset;
      const popup = Menu.buildFromTemplate(
        this.fromMenuDto(event.sender, menuId, menu)
      );
      this.openPopups.set(menuId, popup);
      popup.popup({
        x,
        y,
        callback: () => {
          this.openPopups.delete(menuId);
          event.sender.send(CHANNEL_ON_CLOSE_POPUP, menuId);
        },
      });
    });

    ipcMain.handle(CHANNEL_CLOSE_POPUP, (event, handle) => {
      if (this.openPopups.has(handle)) {
        this.openPopups.get(handle)!.closePopup();
      }
    });

    // focus windows for secondary window support
    ipcMain.on(CHANNEL_FOCUS_WINDOW, (event, windowName) => {
      const electronWindow = BrowserWindow.getAllWindows().find(
        (win) => win.webContents.mainFrame.name === windowName
      );
      if (electronWindow) {
        if (electronWindow.isMinimized()) {
          electronWindow.restore();
        }
        electronWindow.focus();
      } else {
        console.warn(
          `There is no known secondary window '${windowName}'. Thus, the window could not be focussed.`
        );
      }
    });

    ipcMain.on(CHANNEL_SHOW_ITEM_IN_FOLDER, (event, fsPath) => {
      shell.showItemInFolder(fsPath);
    });

    ipcMain.handle(CHANNEL_GET_TITLE_STYLE_AT_STARTUP, (event) =>
      application.getTitleBarStyleAtStartup(event.sender)
    );

    ipcMain.on(CHANNEL_SET_TITLE_STYLE, (event, style) =>
      application.setTitleBarStyle(event.sender, style)
    );

    ipcMain.on(CHANNEL_MINIMIZE, (event) => {
      BrowserWindow.fromWebContents(event.sender)?.minimize();
    });

    ipcMain.on(CHANNEL_IS_MAXIMIZED, (event) => {
      event.returnValue = BrowserWindow.fromWebContents(
        event.sender
      )?.isMaximized();
    });

    ipcMain.on(CHANNEL_MAXIMIZE, (event) => {
      BrowserWindow.fromWebContents(event.sender)?.maximize();
    });

    ipcMain.on(CHANNEL_UNMAXIMIZE, (event) => {
      BrowserWindow.fromWebContents(event.sender)?.unmaximize();
    });

    ipcMain.on(CHANNEL_CLOSE, (event) => {
      BrowserWindow.fromWebContents(event.sender)?.close();
    });

    ipcMain.on(CHANNEL_RESTART, (event) => {
      application.restart(event.sender);
    });

    ipcMain.on(CHANNEL_TOGGLE_DEVTOOLS, (event) => {
      event.sender.toggleDevTools();
    });

    ipcMain.on(CHANNEL_SET_ZOOM_LEVEL, (event, zoomLevel: number) => {
      event.sender.setZoomLevel(zoomLevel);
    });

    ipcMain.handle(CHANNEL_GET_ZOOM_LEVEL, (event) =>
      event.sender.getZoomLevel()
    );

    ipcMain.on(CHANNEL_TOGGLE_FULL_SCREEN, (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.setFullScreen(!win.isFullScreen());
      }
    });
    ipcMain.on(CHANNEL_IS_FULL_SCREENABLE, (event) => {
      event.returnValue = BrowserWindow.fromWebContents(
        event.sender
      )?.isFullScreenable();
    });

    ipcMain.on(CHANNEL_IS_FULL_SCREEN, (event) => {
      event.returnValue = BrowserWindow.fromWebContents(
        event.sender
      )?.isFullScreen();
    });

    ipcMain.on(CHANNEL_READ_CLIPBOARD, (event) => {
      event.returnValue = clipboard.readText();
    });
    ipcMain.on(CHANNEL_WRITE_CLIPBOARD, (event, text) => {
      clipboard.writeText(text);
    });

    nativeKeymap.onDidChangeKeyboardLayout(() => {
      const newLayout = {
        info: nativeKeymap.getCurrentKeyboardLayout(),
        mapping: nativeKeymap.getKeyMap(),
      };
      for (const webContent of webContents.getAllWebContents()) {
        webContent.send('keyboardLayoutChanged', newLayout);
      }
    });
  }

  override fromMenuDto(
    sender: Electron.WebContents,
    menuId: number,
    menuDto: InternalMenuDto[]
  ): Electron.MenuItemConstructorOptions[] {
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
        result.submenu = this.fromMenuDto(sender, menuId, dto.submenu);
      }
      // Fix for handlerId === 0
      // https://github.com/eclipse-theia/theia/pull/12500#issuecomment-1686074836
      if (typeof dto.handlerId === 'number') {
        result.click = () => {
          sender.send(CHANNEL_INVOKE_MENU, menuId, dto.handlerId);
        };
      }
      return result;
    });
  }
}
