import { FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { injectable, inject } from "inversify";
import { ArduinoToolbar } from "./arduino-toolbar";
import { TabBarToolbarRegistry, TabBarToolbarFactory, TabBarToolbar } from "@theia/core/lib/browser/shell/tab-bar-toolbar";

@injectable()
export class ArduinoToolbarContribution implements FrontendApplicationContribution {

    protected toolbarWidget: ArduinoToolbar;

    constructor(
        @inject(TabBarToolbarRegistry) protected tabBarToolBarRegistry: TabBarToolbarRegistry,
        @inject(TabBarToolbarFactory) protected tabBarToolBarFactory: () => TabBarToolbar) {
        this.toolbarWidget = new ArduinoToolbar(this.tabBarToolBarRegistry, this.tabBarToolBarFactory);
    }

    onStart(app: FrontendApplication) {
        app.shell.addWidget(this.toolbarWidget, {
            area: 'top'
        })
    }
}