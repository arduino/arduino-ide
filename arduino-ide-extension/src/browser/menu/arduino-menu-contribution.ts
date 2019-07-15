import { injectable } from "inversify";
import { BrowserMenuBarContribution } from "@theia/core/lib/browser/menu/browser-menu-plugin";
import { FrontendApplication } from "@theia/core/lib/browser";

@injectable()
export class ArduinoMenuContribution extends BrowserMenuBarContribution {
    onStart(app: FrontendApplication): void {
        const menu = this.factory.createMenuBar();
        app.shell.addWidget(menu, { area: 'top' });
    }
}