import * as React from 'react';
import { injectable, inject } from 'inversify';
import { AbstractViewContribution, codicon } from '@theia/core/lib/browser';
import { MonitorWidget } from './monitor-widget';
import { MenuModelRegistry, Command, CommandRegistry } from '@theia/core';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { nls } from '@theia/core/lib/common';
import { MonitorModel } from '../../monitor-model';

export namespace SerialMonitor {
  export namespace Commands {
    export const AUTOSCROLL = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-autoscroll',
        label: 'Autoscroll',
      },
      'arduino/serial/autoscroll'
    );
    export const TIMESTAMP = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-timestamp',
        label: 'Timestamp',
      },
      'arduino/serial/timestamp'
    );
    export const CLEAR_OUTPUT = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-clear-output',
        label: 'Clear Output',
        iconClass: codicon('clear-all'),
      },
      'vscode/output.contribution/clearOutput.label'
    );
  }
}

@injectable()
export class MonitorViewContribution
  extends AbstractViewContribution<MonitorWidget>
  implements TabBarToolbarContribution
{
  static readonly TOGGLE_SERIAL_MONITOR = MonitorWidget.ID + ':toggle';
  static readonly TOGGLE_SERIAL_MONITOR_TOOLBAR =
    MonitorWidget.ID + ':toggle-toolbar';

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  constructor() {
    super({
      widgetId: MonitorWidget.ID,
      widgetName: MonitorWidget.LABEL,
      defaultWidgetOptions: {
        area: 'bottom',
      },
      toggleCommandId: MonitorViewContribution.TOGGLE_SERIAL_MONITOR,
      toggleKeybinding: 'CtrlCmd+Shift+M',
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    if (this.toggleCommand) {
      menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
        commandId: this.toggleCommand.id,
        label: MonitorWidget.LABEL,
        order: '5',
      });
    }
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: 'monitor-autoscroll',
      render: () => this.renderAutoScrollButton(),
      isVisible: (widget) => widget instanceof MonitorWidget,
      onDidChange: this.model.onChange as any, // XXX: it's a hack. See: https://github.com/eclipse-theia/theia/pull/6696/
    });
    registry.registerItem({
      id: 'monitor-timestamp',
      render: () => this.renderTimestampButton(),
      isVisible: (widget) => widget instanceof MonitorWidget,
      onDidChange: this.model.onChange as any, // XXX: it's a hack. See: https://github.com/eclipse-theia/theia/pull/6696/
    });
    registry.registerItem({
      id: SerialMonitor.Commands.CLEAR_OUTPUT.id,
      command: SerialMonitor.Commands.CLEAR_OUTPUT.id,
      tooltip: nls.localize(
        'vscode/output.contribution/clearOutput.label',
        'Clear Output'
      ),
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(SerialMonitor.Commands.CLEAR_OUTPUT, {
      isEnabled: (widget) => widget instanceof MonitorWidget,
      isVisible: (widget) => widget instanceof MonitorWidget,
      execute: (widget) => {
        if (widget instanceof MonitorWidget) {
          widget.clearConsole();
        }
      },
    });
    if (this.toggleCommand) {
      commands.registerCommand(this.toggleCommand, {
        execute: () => this.toggle(),
      });
      commands.registerCommand(
        { id: MonitorViewContribution.TOGGLE_SERIAL_MONITOR_TOOLBAR },
        {
          isVisible: (widget) =>
            ArduinoToolbar.is(widget) && widget.side === 'right',
          execute: () => this.toggle(),
        }
      );
    }
  }

  protected async toggle(): Promise<void> {
    const widget = this.tryGetWidget();
    if (widget) {
      widget.dispose();
    } else {
      await this.openView({ activate: true, reveal: true });
    }
  }

  protected renderAutoScrollButton(): React.ReactNode {
    return (
      <React.Fragment key="autoscroll-toolbar-item">
        <div
          title={nls.localize(
            'vscode/output.contribution/toggleAutoScroll',
            'Toggle Autoscroll'
          )}
          className={`item enabled fa fa-angle-double-down arduino-monitor ${
            this.model.autoscroll ? 'toggled' : ''
          }`}
          onClick={this.toggleAutoScroll}
        ></div>
      </React.Fragment>
    );
  }

  protected readonly toggleAutoScroll = () => this.doToggleAutoScroll();
  protected async doToggleAutoScroll(): Promise<void> {
    this.model.toggleAutoscroll();
  }

  protected renderTimestampButton(): React.ReactNode {
    return (
      <React.Fragment key="line-ending-toolbar-item">
        <div
          title={nls.localize(
            'arduino/serial/toggleTimestamp',
            'Toggle Timestamp'
          )}
          className={`item enabled fa fa-clock-o arduino-monitor ${
            this.model.timestamp ? 'toggled' : ''
          }`}
          onClick={this.toggleTimestamp}
        ></div>
      </React.Fragment>
    );
  }

  protected readonly toggleTimestamp = () => this.doToggleTimestamp();
  protected async doToggleTimestamp(): Promise<void> {
    this.model.toggleTimestamp();
  }
}
