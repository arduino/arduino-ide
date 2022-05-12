import { injectable } from 'inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import {
  ElectronMenuContribution as TheiaElectronMenuContribution,
  ElectronCommands,
} from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { FrontendApplication, PreferenceScope } from '@theia/core/lib/browser';
import * as electronRemote from '@theia/electron/shared/@electron/remote';
import { ZoomLevel } from '@theia/core/lib/electron-browser/window/electron-window-preferences';

@injectable()
export class ElectronMenuContribution
  extends TheiaElectronMenuContribution
  implements MainMenuManager
{
  onStart(app: FrontendApplication): void {
    requestAnimationFrame(() => super.onStart(app));
  }

  protected hideTopPanel(): void {
    // NOOP
    // We reuse the `div` for the Arduino toolbar.
  }

  update(): void {
    (this as any).setMenu();
  }

  protected setMenu(
    app: FrontendApplication,
    electronMenu?: Electron.CrossProcessExports.Menu | null,
    electronWindow?: Electron.CrossProcessExports.BrowserWindow
  ): void {
    requestAnimationFrame(() =>
      this.setMenu(app, electronMenu, electronWindow)
    );
  }

  registerCommands(registry: CommandRegistry): void {
    this.superRegisterCommands(registry);
    registry.unregisterCommand(ElectronCommands.CLOSE_WINDOW);
  }

  registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    registry.unregisterMenuAction(ElectronCommands.CLOSE_WINDOW);
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    super.registerKeybindings(registry);
    registry.unregisterKeybinding(ElectronCommands.CLOSE_WINDOW.id);
    registry.unregisterKeybinding(ElectronCommands.ZOOM_IN.id);
    registry.unregisterKeybinding(ElectronCommands.ZOOM_OUT.id);
  }

  private superRegisterCommands(registry: CommandRegistry): void {
    registry.registerCommand(ElectronCommands.TOGGLE_DEVELOPER_TOOLS, {
      execute: () => {
        const webContent = electronRemote.getCurrentWebContents();
        if (!webContent.isDevToolsOpened()) {
          webContent.openDevTools();
        } else {
          webContent.closeDevTools();
        }
      },
    });

    registry.registerCommand(ElectronCommands.RELOAD, {
      execute: () => this.currentWindow().reload(),
    });
    registry.registerCommand(ElectronCommands.CLOSE_WINDOW, {
      execute: () => this.currentWindow().close(),
    });

    registry.registerCommand(ElectronCommands.ZOOM_IN, {
      execute: () => {
        const webContents = this.currentWindow().webContents;
        // When starting at a level that is not a multiple of 0.5, increment by at most 0.5 to reach the next highest multiple of 0.5.
        let zoomLevel =
          Math.floor(webContents.zoomLevel / ZoomLevel.VARIATION) *
            ZoomLevel.VARIATION +
          ZoomLevel.VARIATION;
        if (zoomLevel > ZoomLevel.MAX) {
          zoomLevel = ZoomLevel.MAX;
          return;
        }
        this.preferenceService.set(
          'window.zoomLevel',
          zoomLevel,
          PreferenceScope.User
        );
      },
    });
    registry.registerCommand(ElectronCommands.ZOOM_OUT, {
      execute: () => {
        const webContents = this.currentWindow().webContents;
        // When starting at a level that is not a multiple of 0.5, decrement by at most 0.5 to reach the next lowest multiple of 0.5.
        let zoomLevel =
          Math.ceil(webContents.zoomLevel / ZoomLevel.VARIATION) *
            ZoomLevel.VARIATION -
          ZoomLevel.VARIATION;
        if (zoomLevel < ZoomLevel.MIN) {
          zoomLevel = ZoomLevel.MIN;
          return;
        }
        this.preferenceService.set(
          'window.zoomLevel',
          zoomLevel,
          PreferenceScope.User
        );
      },
    });
    registry.registerCommand(ElectronCommands.RESET_ZOOM, {
      execute: () =>
        this.preferenceService.set(
          'window.zoomLevel',
          ZoomLevel.DEFAULT,
          PreferenceScope.User
        ),
    });
    registry.registerCommand(ElectronCommands.TOGGLE_FULL_SCREEN, {
      isEnabled: () => this.currentWindow().isFullScreenable(),
      isVisible: () => this.currentWindow().isFullScreenable(),
      execute: () =>
        this.currentWindow().setFullScreen(
          !this.currentWindow().isFullScreen()
        ),
    });
  }

  private currentWindow() {
    return electronRemote.getCurrentWindow();
  }
}
