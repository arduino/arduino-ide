import { injectable } from '@theia/core/shared/inversify';
import {
  BrowserMainMenuFactory as TheiaBrowserMainMenuFactory,
  MenuBarWidget,
} from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { MainMenuManager } from '../../../common/main-menu-manager';

@injectable()
export class BrowserMainMenuFactory
  extends TheiaBrowserMainMenuFactory
  implements MainMenuManager
{
  protected menuBar: MenuBarWidget | undefined;

  override createMenuBar(): MenuBarWidget {
    this.menuBar = super.createMenuBar();
    return this.menuBar;
  }

  update(): void {
    if (this.menuBar) {
      this.menuBar.clearMenus();
      this.fillMenuBar(this.menuBar);
    }
  }
}