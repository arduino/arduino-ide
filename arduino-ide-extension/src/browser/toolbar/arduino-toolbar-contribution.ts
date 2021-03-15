import { FrontendApplicationContribution, FrontendApplication, Widget, Message } from '@theia/core/lib/browser';
import { injectable, inject } from 'inversify';
import { ArduinoToolbar } from './arduino-toolbar';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core';
import { LabelParser } from '@theia/core/lib/browser/label-parser';

export class ArduinoToolbarContainer extends Widget {

    protected toolbars: ArduinoToolbar[];

    constructor(...toolbars: ArduinoToolbar[]) {
        super();
        this.id = 'arduino-toolbar-container';
        this.toolbars = toolbars;
    }

    onAfterAttach(msg: Message) {
        for (const toolbar of this.toolbars) {
            Widget.attach(toolbar, this.node);
        }
    }
}

@injectable()
export class ArduinoToolbarContribution implements FrontendApplicationContribution {

    protected arduinoToolbarContainer: ArduinoToolbarContainer;

    constructor(
        @inject(TabBarToolbarRegistry) protected tabBarToolBarRegistry: TabBarToolbarRegistry,
        @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
        @inject(LabelParser) protected labelParser: LabelParser) {
        const leftToolbarWidget = new ArduinoToolbar(tabBarToolBarRegistry, commandRegistry, labelParser, 'left');
        const rightToolbarWidget = new ArduinoToolbar(tabBarToolBarRegistry, commandRegistry, labelParser, 'right');
        this.arduinoToolbarContainer = new ArduinoToolbarContainer(leftToolbarWidget, rightToolbarWidget);
    }


    onStart(app: FrontendApplication) {
        app.shell.addWidget(this.arduinoToolbarContainer, {
            area: 'top'
        });
    }
}