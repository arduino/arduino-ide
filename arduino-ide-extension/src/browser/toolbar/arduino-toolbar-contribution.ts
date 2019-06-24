import { FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { injectable, inject } from "inversify";
import { ArduinoToolbar } from "./arduino-toolbar";
import { TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";

@injectable()
export class ArduinoToolbarContribution implements FrontendApplicationContribution {

    protected toolbarWidget: ArduinoToolbar;

    constructor(
        @inject(TabBarToolbarRegistry) protected tabBarToolBarRegistry: TabBarToolbarRegistry) {
        this.toolbarWidget = new ArduinoToolbar(tabBarToolBarRegistry);
    }

    onStart(app: FrontendApplication) {
        app.shell.addWidget(this.toolbarWidget, {
            area: 'top'
        })
    }
}