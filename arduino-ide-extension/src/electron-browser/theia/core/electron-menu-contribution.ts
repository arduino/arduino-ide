import type { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import type { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import type { CommandRegistry } from '@theia/core/lib/common/command';
import type { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { isOSX } from '@theia/core/lib/common/os';
import {
  ElectronCommands,
  ElectronMenuContribution as TheiaElectronMenuContribution,
} from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import type { MenuDto } from '@theia/core/lib/electron-common/electron-api';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { MainMenuManager } from '../../../common/main-menu-manager';
import { ElectronMainMenuFactory } from './electron-main-menu-factory';

@injectable()
export class ElectronMenuUpdater implements MainMenuManager {
  @inject(ElectronMainMenuFactory)
  protected readonly factory: ElectronMainMenuFactory;

  public update(): void {
    this.setMenu();
  }

  private setMenu(): void {
    window.electronArduino.setMenu(this.factory.createElectronMenuBar());
  }
}

@injectable()
export class ElectronMenuContribution extends TheiaElectronMenuContribution {
  protected override hideTopPanel(): void {
    // NOOP
    // We reuse the `div` for the Arduino toolbar.
  }

  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
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

  protected override setMenu(
    app: FrontendApplication,
    electronMenu: MenuDto[] | undefined = this.factory.createElectronMenuBar()
  ): void {
    if (!isOSX) {
      this.hideTopPanel(); // no app args. the overridden method is noop in IDE2.
      if (this.titleBarStyle === 'custom' && !this.menuBar) {
        this.createCustomTitleBar(app);
        return;
      }
    }
    window.electronArduino.setMenu(electronMenu); // overridden to call the IDE20-specific implementation.
  }
}
