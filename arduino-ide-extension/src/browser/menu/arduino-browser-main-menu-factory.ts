import { injectable } from 'inversify';
import { BrowserMainMenuFactory, MenuBarWidget } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { MainMenuManager } from './main-menu-manager';

@injectable()
export class ArduinoBrowserMainMenuFactory extends BrowserMainMenuFactory implements MainMenuManager {

    protected menuBar: MenuBarWidget | undefined;

    createMenuBar(): MenuBarWidget {
        this.menuBar = super.createMenuBar();
        return this.menuBar;
    }

    update() {
        if (this.menuBar) {
            this.menuBar.clearMenus();
            this.fillMenuBar(this.menuBar);
        }
    }

}
