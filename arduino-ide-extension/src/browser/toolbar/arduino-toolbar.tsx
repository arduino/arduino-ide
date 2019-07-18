import * as React from 'react';
import { TabBarToolbar, TabBarToolbarRegistry, TabBarToolbarItem, ReactTabBarToolbarItem } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { ReactWidget } from '@theia/core/lib/browser';
import { LabelParser } from '@theia/core/lib/browser/label-parser';

export const ARDUINO_TOOLBAR_ITEM_CLASS = 'arduino-tool-item';

export namespace ArduinoToolbarComponent {
    export interface Props {
        items: (TabBarToolbarItem | ReactTabBarToolbarItem)[],
        commands: CommandRegistry,
        commandIsEnabled: (id: string) => boolean,
        executeCommand: (e: React.MouseEvent<HTMLElement>) => void
    }
    export interface State {
        tooltip: string
    }
}
export class ArduinoToolbarComponent extends React.Component<ArduinoToolbarComponent.Props, ArduinoToolbarComponent.State> {

    constructor(props: ArduinoToolbarComponent.Props) {
        super(props);
        this.state = { tooltip: '' };
    }

    protected renderItem = (item: TabBarToolbarItem) => {
        let innerText = '';
        const command = this.props.commands.getCommand(item.command);
        const cls = `${ARDUINO_TOOLBAR_ITEM_CLASS} ${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} ${command && this.props.commandIsEnabled(command.id) ? ' enabled' : ''}`
        return <div key={item.id}
                className={cls} >
                <div
                    key={item.id + '-icon'}
                    id={item.id}
                    className={`${item.id} arduino-tool-icon`}
                    onClick={this.props.executeCommand}
                    onMouseOver={() => this.setState({ tooltip: item.tooltip || '' })}
                    onMouseOut={() => this.setState({ tooltip: '' })}
                    title={item.tooltip}>
                    {innerText}
                </div>
            </div>
    }

    render(): React.ReactNode {
        return <React.Fragment>
            <div key='arduino-toolbar-tooltip' className={'arduino-toolbar-tooltip'}>{this.state.tooltip}</div>
            {[...this.props.items].map(item => TabBarToolbarItem.is(item) ? this.renderItem(item) : item.render())}
        </React.Fragment>;
    }
}

export class ArduinoToolbar extends ReactWidget {

    protected items = new Map<string, TabBarToolbarItem | ReactTabBarToolbarItem>();

    constructor(
        protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
        protected readonly commands: CommandRegistry,
        protected readonly labelParser: LabelParser
    ) {
        super();
        this.id = 'arduino-toolbar';
        this.addClass(TabBarToolbar.Styles.TAB_BAR_TOOLBAR);
        this.init();
        this.tabBarToolbarRegistry.onDidChange(() => this.updateToolbar());
    }

    protected updateItems(items: Array<TabBarToolbarItem | ReactTabBarToolbarItem>): void {
        this.items.clear();
        const revItems = items.reverse();
        for (const item of revItems) {
            this.items.set(item.id, item);
        }
        this.update();
    }

    protected updateToolbar(): void {
        const items = this ? this.tabBarToolbarRegistry.visibleItems(this) : [];
        this.updateItems(items);
    }

    protected init(): void {
        this.node.classList.add('theia-arduino-toolbar');
        this.update();
    }

    protected readonly doCommandIsEnabled = (id: string) => this.commandIsEnabled(id);
    protected commandIsEnabled(command: string): boolean {
        return this.commands.isEnabled(command, this);
    }

    protected render(): React.ReactNode {
        return <ArduinoToolbarComponent
            items={[...this.items.values()]}
            commands={this.commands}
            commandIsEnabled={this.doCommandIsEnabled}
            executeCommand={this.executeCommand}
        />
    }

    protected executeCommand = (e: React.MouseEvent<HTMLElement>) => {
        const item = this.items.get(e.currentTarget.id);
        if (TabBarToolbarItem.is(item)) {
            this.commands.executeCommand(item.command, this, e.target);
        }
    }
}
