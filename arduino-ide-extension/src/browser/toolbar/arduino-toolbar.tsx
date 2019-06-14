import * as React from 'react';
import { TabBarToolbar, TabBarToolbarRegistry, TabBarToolbarItem } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { LabelParser } from '@theia/core/lib/browser/label-parser';
import { CommandRegistry } from '@theia/core/lib/common/command';

export const ARDUINO_TOOLBAR_ITEM_CLASS = 'arduino-tool-item';

export class ArduinoToolbar extends TabBarToolbar {

    constructor(
        protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
        commands: CommandRegistry, labelParser: LabelParser
    ) {
        super(commands, labelParser);
        this.id = 'arduino-toolbar';
        this.init();
        this.tabBarToolbarRegistry.onDidChange(() => this.updateToolbar());
    }

    protected updateToolbar(): void {
        const items = this ? this.tabBarToolbarRegistry.visibleItems(this) : [];
        this.updateItems(items, this);
    }

    protected init(): void {
        this.node.classList.add('theia-arduino-toolbar');
        this.update();
    }

    protected renderItem(item: TabBarToolbarItem): React.ReactNode {
        let innerText = '';
        const command = this.commands.getCommand(item.command);
        return <div key={item.id}
            className={`${ARDUINO_TOOLBAR_ITEM_CLASS} 
        ${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM}${command && this.commandIsEnabled(command.id) ? ' enabled' : ''}`} >
            <div id={item.id} className='arduino-tool-icon' onClick={this.executeCommand} title={item.tooltip}>{innerText}</div>
        </div>;
    }
}
