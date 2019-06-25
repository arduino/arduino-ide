import { FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { injectable, inject } from "inversify";
import { ArduinoToolbar } from "./arduino-toolbar";
import { TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { CommandRegistry } from "@theia/core";
import { LabelParser } from "@theia/core/lib/browser/label-parser";

@injectable()
export class ArduinoToolbarContribution implements FrontendApplicationContribution {

    protected toolbarWidget: ArduinoToolbar;

    constructor(
        @inject(TabBarToolbarRegistry) protected tabBarToolBarRegistry: TabBarToolbarRegistry,
        @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
        @inject(LabelParser) protected labelParser: LabelParser) {
        this.toolbarWidget = new ArduinoToolbar(tabBarToolBarRegistry, commandRegistry, labelParser);
    }


    onStart(app: FrontendApplication) {
        app.shell.addWidget(this.toolbarWidget, {
            area: 'top'
        })
    }
}