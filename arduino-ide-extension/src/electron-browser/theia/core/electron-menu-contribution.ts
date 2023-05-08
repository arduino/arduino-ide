import {
  getCurrentWebContents,
  getCurrentWindow,
} from '@theia/core/electron-shared/@electron/remote';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { PreferenceScope } from '@theia/core/lib/browser/preferences/preference-scope';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import {
  ElectronCommands,
  ElectronMenuContribution as TheiaElectronMenuContribution,
} from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { ZoomLevel } from '@theia/core/lib/electron-browser/window/electron-window-preferences';
import { injectable } from '@theia/core/shared/inversify';
import { MainMenuManager } from '../../../common/main-menu-manager';

@injectable()
export class ElectronMenuContribution
  extends TheiaElectronMenuContribution
  implements MainMenuManager
{
  private app: FrontendApplication;

  override onStart(app: FrontendApplication): void {
    this.app = app;
    super.onStart(app);
  }

  update(): void {
    // no menu updates before `onStart`
    if (!this.app) {
      return;
    }
    this.setMenu(this.app);
  }

  override registerCommands(registry: CommandRegistry): void {
    this.theiaRegisterCommands(registry);
    registry.unregisterCommand(ElectronCommands.CLOSE_WINDOW);
  }

  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    registry.unregisterMenuAction(ElectronCommands.CLOSE_WINDOW);
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    super.registerKeybindings(registry);
    registry.unregisterKeybinding(ElectronCommands.CLOSE_WINDOW.id);
    registry.unregisterKeybinding(ElectronCommands.ZOOM_IN.id);
    registry.unregisterKeybinding(ElectronCommands.ZOOM_OUT.id);
  }

  // Copied from Theia: https://github.com/eclipse-theia/theia/blob/9ec8835cf35d5a46101a62ae93285aeb37a2f382/packages/core/src/electron-browser/menu/electron-menu-contribution.ts#L260-L314
  // Unlike the Theia implementation, this does not require synchronously the browser window, but use a function only when the command handler executes.
  private theiaRegisterCommands(registry: CommandRegistry): void {
    const currentWindow = () => getCurrentWindow();

    registry.registerCommand(ElectronCommands.TOGGLE_DEVELOPER_TOOLS, {
      execute: () => {
        const webContent = getCurrentWebContents();
        if (!webContent.isDevToolsOpened()) {
          webContent.openDevTools();
        } else {
          webContent.closeDevTools();
        }
      },
    });

    registry.registerCommand(ElectronCommands.RELOAD, {
      execute: () => this.windowService.reload(),
    });
    registry.registerCommand(ElectronCommands.CLOSE_WINDOW, {
      execute: () => currentWindow().close(),
    });

    registry.registerCommand(ElectronCommands.ZOOM_IN, {
      execute: () => {
        const webContents = currentWindow().webContents;
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
        const webContents = currentWindow().webContents;
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
      isEnabled: () => currentWindow().isFullScreenable(),
      isVisible: () => currentWindow().isFullScreenable(),
      execute: () =>
        currentWindow().setFullScreen(!currentWindow().isFullScreen()),
    });
  }
}
