import {
  ContextMenuAccess,
  coordinateFromAnchor,
  RenderContextMenuOptions,
} from '@theia/core/lib/browser/context-menu-renderer';
import {
  ElectronContextMenuAccess,
  ElectronContextMenuRenderer as TheiaElectronContextMenuRenderer,
} from '@theia/core/lib/electron-browser/menu/electron-context-menu-renderer';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class ElectronContextMenuRenderer extends TheiaElectronContextMenuRenderer {
  protected override doRender(
    options: RenderContextMenuOptions
  ): ContextMenuAccess {
    if (this.useNativeStyle) {
      const { menuPath, anchor, args, onHide, context, contextKeyService } =
        options;
      const menu = this['electronMenuFactory'].createElectronContextMenu(
        menuPath,
        args,
        context,
        contextKeyService,
        this.showDisabled(options)
      );
      let { x, y } = coordinateFromAnchor(anchor);
      
      // Fix: Tools menu items unreachable when menu overflows screen height
      // Affects boards with many Tools entries e.g. RP2040 Pico core
      // https://github.com/arduino/arduino-ide/issues/[ISSUE_NUMBER]
      y = this.clampMenuY(y, menu);
      
      const menuHandle = window.electronTheiaCore.popup(menu, x, y, () => {
        if (onHide) {
          onHide();
        }
      });
      // native context menu stops the event loop, so there is no keyboard events
      this.context.resetAltPressed();
      return new ElectronContextMenuAccess(menuHandle);
    } else {
      return super.doRender(options);
    }
  }

  /**
   * Clamp the menu Y position to ensure it doesn't overflow below the screen.
   * Prevents the native OS scroll arrows from creating feedback loops that hide menu items.
   */
  private clampMenuY(y: number, menu: unknown): number {
    try {
      // Use browser's built-in window.screen API
      // Safe in renderer context — no Node.js dependencies
      const availHeight = window.screen.availHeight;

      // Estimate menu height: ~24px per item + 10px padding
      const MENU_ITEM_HEIGHT = 24;
      const MENU_PADDING = 10;
      const estimatedMenuHeight =
        this.countMenuItems(menu) * MENU_ITEM_HEIGHT + MENU_PADDING;

      // Clamp Y so menu doesn't extend below available screen area
      const clampedY = Math.min(y, availHeight - estimatedMenuHeight);
      return Math.max(clampedY, 0);
    } catch (error) {
      console.warn('Failed to clamp menu Y position:', error);
      return y;
    }
  }

  /**
   * Recursively count menu items to estimate menu height.
   */
  private countMenuItems(menu: unknown): number {
    try {
      // Safety check: ensure menu is an array
      if (!Array.isArray(menu)) {
        return 0;
      }
      
      return menu.reduce((count, item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const menuItem = item as any;
        if (menuItem && menuItem.type === 'separator') {
          return count + 1;
        }
        if (menuItem && Array.isArray(menuItem.submenu)) {
          return count + 1 + this.countMenuItems(menuItem.submenu);
        }
        return count + 1;
      }, 0);
    } catch (error) {
      console.warn('Failed to count menu items:', error);
      return 0;
    }
  }

  /**
   * Theia does not allow selectively control whether disabled menu items are visible or not. This is a workaround.
   * Attach the `showDisabled: true` to the `RenderContextMenuOptions` object, and you can control it.
   * https://github.com/eclipse-theia/theia/blob/d59d5279b93e5050c2cbdd4b6726cab40187c50e/packages/core/src/electron-browser/menu/electron-main-menu-factory.ts#L134.
   */
  private showDisabled(options: RenderContextMenuOptions): boolean {
    if ('showDisabled' in options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = options as any;
      const showDisabled = object['showDisabled'] as unknown;
      return typeof showDisabled === 'boolean' && Boolean(showDisabled);
    }
    return false;
  }
}
