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
      const { x, y } = coordinateFromAnchor(anchor);
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
