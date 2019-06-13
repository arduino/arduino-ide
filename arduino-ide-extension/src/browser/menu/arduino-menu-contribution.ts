import { injectable } from "inversify";
import { BrowserMenuBarContribution } from "@theia/core/lib/browser/menu/browser-menu-plugin";
import { FrontendApplication } from "@theia/core/lib/browser";

@injectable()
export class ArduinoMenuContribution extends BrowserMenuBarContribution {
    onStart(app: FrontendApplication): void {
        if (this.isProMode()) {
            const menu = this.factory.createMenuBar();
            app.shell.addWidget(menu, { area: 'top' });
        }
    }

    protected isProMode(): boolean {
        // TODO ask for pro preference
        return false;
    }
}