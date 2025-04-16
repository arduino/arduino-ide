import React from '@theia/core/shared/react';
import {
  TabBarToolbar,
  TabBarToolbarRegistry,
  TabBarToolbarItem,
  ReactTabBarToolbarItem,
  RenderedToolbarItem,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { ReactWidget } from '@theia/core/lib/browser';
import { LabelParser, LabelIcon } from '@theia/core/lib/browser/label-parser';

export const ARDUINO_TOOLBAR_ITEM_CLASS = 'arduino-tool-item';

export namespace ArduinoToolbarComponent {
  export interface Props {
    side: 'left' | 'right';
    items: TabBarToolbarItem[];
    commands: CommandRegistry;
    labelParser: LabelParser;
    commandIsEnabled: (id: string) => boolean;
    commandIsToggled: (id: string) => boolean;
    executeCommand: (e: React.MouseEvent<HTMLElement>) => void;
  }
  export interface State {
    tooltip: string;
  }
}
export class ArduinoToolbarComponent extends React.Component<
  ArduinoToolbarComponent.Props,
  ArduinoToolbarComponent.State
> {
  constructor(props: ArduinoToolbarComponent.Props) {
    super(props);
    this.state = { tooltip: '' };
  }

  protected renderItem = (item: RenderedToolbarItem) => {
    let innerText = '';
    let className = `arduino-tool-icon ${item.id}-icon`;
    if (item.text) {
      for (const labelPart of this.props.labelParser.parse(item.text)) {
        if (typeof labelPart !== 'string' && LabelIcon.is(labelPart)) {
          className += ` fa fa-${labelPart.name}`;
        } else {
          innerText = labelPart;
        }
      }
    }
    const command =
      item.command && this.props.commands.getCommand(item.command);
    const cls = `${ARDUINO_TOOLBAR_ITEM_CLASS} ${
      TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM
    } ${command && this.props.commandIsEnabled(command.id) ? 'enabled' : ''} ${
      command && this.props.commandIsToggled(command.id) ? 'toggled' : ''
    }`;
    return (
      <div key={item.id} className={cls}>
        <div className={item.id}>
          <div
            key={item.id + '-icon'}
            id={item.id}
            className={className}
            onClick={this.props.executeCommand}
            onMouseOver={() => this.setState({ tooltip: item.tooltip || '' })}
            onMouseOut={() => this.setState({ tooltip: '' })}
            title={item.tooltip}
          >
            {innerText}
          </div>
        </div>
      </div>
    );
  };

  override render(): React.ReactNode {
    const tooltip = (
      <div key="arduino-toolbar-tooltip" className={'arduino-toolbar-tooltip'}>
        {this.state.tooltip}
      </div>
    );
    const items = [
      <React.Fragment key={this.props.side + '-arduino-toolbar-tooltip'}>
        {[...this.props.items].map((item) =>
          ReactTabBarToolbarItem.is(item)
            ? item.render()
            : this.renderItem(item)
        )}
      </React.Fragment>,
    ];
    if (this.props.side === 'left') {
      items.unshift(tooltip);
    } else {
      items.push(tooltip);
    }
    return items;
  }
}

export class ArduinoToolbar extends ReactWidget {
  protected items = new Map<string, TabBarToolbarItem>();

  constructor(
    protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
    protected readonly commands: CommandRegistry,
    protected readonly labelParser: LabelParser,
    public readonly side: 'left' | 'right'
  ) {
    super();
    this.id = side + '-arduino-toolbar';
    this.addClass(TabBarToolbar.Styles.TAB_BAR_TOOLBAR);
    this.init();
    this.tabBarToolbarRegistry.onDidChange(() => this.updateToolbar());
  }

  protected updateItems(items: Array<TabBarToolbarItem>): void {
    this.items.clear();
    const revItems = items
      .sort(TabBarToolbarItem.PRIORITY_COMPARATOR)
      .reverse();
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
    this.node.classList.add('theia-arduino-toolbar', this.side);
    this.update();
  }

  protected readonly doCommandIsEnabled = (id: string) =>
    this.commandIsEnabled(id);
  protected commandIsEnabled(command: string): boolean {
    return this.commands.isEnabled(command, this);
  }
  protected readonly doCommandIsToggled = (id: string) =>
    this.commandIsToggled(id);
  protected commandIsToggled(command: string): boolean {
    return this.commands.isToggled(command, this);
  }

  protected render(): React.ReactNode {
    return (
      <ArduinoToolbarComponent
        key="arduino-toolbar-component"
        side={this.side}
        labelParser={this.labelParser}
        items={[...this.items.values()]}
        commands={this.commands}
        commandIsEnabled={this.doCommandIsEnabled}
        commandIsToggled={this.doCommandIsToggled}
        executeCommand={this.executeCommand}
      />
    );
  }

  protected executeCommand = (e: React.MouseEvent<HTMLElement>) => {
    const item = this.items.get(e.currentTarget.id);
    if (item && item.command) {
      this.commands.executeCommand(item.command, this, e.target);
    }
  };
}

export namespace ArduinoToolbar {
  export function is(
    maybeToolbarWidget: any
  ): maybeToolbarWidget is ArduinoToolbar {
    return maybeToolbarWidget instanceof ArduinoToolbar;
  }
}
