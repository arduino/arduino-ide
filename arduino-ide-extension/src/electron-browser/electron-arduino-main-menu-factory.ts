import { injectable } from "inversify";
import * as electron from 'electron';
import { ElectronMainMenuFactory } from "@theia/core/lib/electron-browser/menu/electron-main-menu-factory";
import {
    isOSX
} from '@theia/core/lib/common';

@injectable()
export class ElectronArduinoMainMenuFactory extends ElectronMainMenuFactory {
    createMenuBar(): Electron.Menu {
        const menuModel = this.menuProvider.getMenu();
        const template = this.fillMenuTemplate([], menuModel);
        if (isOSX) {
            template.unshift(this.createOSXMenu());
        }
        const menu = electron.remote.Menu.buildFromTemplate(template);
        this._menu = menu;
        return menu;
    }
}