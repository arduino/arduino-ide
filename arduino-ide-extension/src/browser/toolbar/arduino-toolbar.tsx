import React from '@theia/core/shared/react';
import {
  TabBarToolbar,
  TabBarToolbarRegistry,
  TabBarToolbarItem,
  ReactTabBarToolbarItem,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { ReactWidget } from '@theia/core/lib/browser';
import { LabelParser, LabelIcon } from '@theia/core/lib/browser/label-parser';

export const ARDUINO_TOOLBAR_ITEM_CLASS = 'arduino-tool-item';

export namespace ArduinoToolbarComponent {
  export interface Props {
    side: 'left' | 'right';
    items: (TabBarToolbarItem | ReactTabBarToolbarItem)[];
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

  protected renderItem = (item: TabBarToolbarItem) => {
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
    const command = this.props.commands.getCommand(item.command);
    const cls = `${ARDUINO_TOOLBAR_ITEM_CLASS} ${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM
      } ${command && this.props.commandIsEnabled(command.id) ? 'enabled' : ''} ${command && this.props.commandIsToggled(command.id) ? 'toggled' : ''
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
    // const tooltip = (
    //   <div key="arduino-toolbar-tooltip" className={'arduino-toolbar-tooltip'}>
    //     {/* {this.state.tooltip} */}
    //     <button>niubu</button>
    //   </div>
    // );
    let tooltip = null;
    if (this.props.side === 'left') {
      tooltip = (
        <div
          key="arduino-toolbar-tooltip"
          className={'arduino-toolbar-tooltip'}
        >
          <img
            src="./icon/icon.ico"
            style={{ height: '28px', width: '28px', marginLeft: '3px' }}
          />
          <span
            style={{
              marginLeft: '13px',
              fontWeight: 'bold',
              fontSize: '15px',
              color: '#050519',
            }}
          >
            零知开源-Powered by零知实验室 v3.60
          </span>
        </div>
      );
    } else {
      tooltip = (
        <div
          key="arduino-toolbar-tooltip"
          className={'arduino-toolbar-tooltip'}
        >
          {/* 菜单按钮 */}
          <div id="lingzhi-menus-id" className="lingzhi-button">
            <img
              src="./icon/menu_normal.png"
              className="lingzhi-button-img"
            ></img>
          </div>

          {/* 最小化按钮 */}
          <div
            id="lingzhi-min-id"
            className="lingzhi-button"
            onClick={() => window.electronArduino.minAPP()}
          >
            <img
              src="./icon/min_normal.png"
              className="lingzhi-button-img"
            ></img>
          </div>

          {/* 最大化按钮 */}
          <div
            id="lingzhi-max-id"
            className="lingzhi-button"
            onClick={() => window.electronArduino.maxAPP()}
          >
            <img
              src="./icon/max_normal.png"
              className="lingzhi-button-img"
            ></img>
          </div>

          {/* 关闭按钮 */}
          <div
            id="lingzhi-close-id"
            className="lingzhi-close-button"
            onClick={() => window.close()}
          >
            <img
              src="./icon/close_normal.png"
              className="lingzhi-button-img"
            ></img>
          </div>
        </div>
      );
    }

    const items = [
      // <React.Fragment key={this.props.side + '-arduino-toolbar-tooltip'}>
      //   {[...this.props.items].map((item) =>
      //     TabBarToolbarItem.is(item) ? this.renderItem(item) : item.render()
      //   )}
      // </React.Fragment>,
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
  protected items = new Map<
    string,
    TabBarToolbarItem | ReactTabBarToolbarItem
  >();

  constructor(
    protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
    protected readonly commands: CommandRegistry,
    protected readonly labelParser: LabelParser,
    public readonly side: 'left' | 'right',
    showToolbar = true // 添加这个参数
  ) {
    super();
    this.id = side + '-arduino-toolbar';
    this.addClass(TabBarToolbar.Styles.TAB_BAR_TOOLBAR);
    this.init();
    this.tabBarToolbarRegistry.onDidChange(() => this.updateToolbar());
  }

  protected updateItems(
    items: Array<TabBarToolbarItem | ReactTabBarToolbarItem>
  ): void {
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
    if (TabBarToolbarItem.is(item)) {
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
