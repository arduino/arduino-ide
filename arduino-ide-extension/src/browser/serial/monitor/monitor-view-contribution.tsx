import React from '@theia/core/shared/react';
import {
  injectable,
  inject,
  postConstruct,
} from '@theia/core/shared/inversify';
import {
  AbstractViewContribution,
  ApplicationShell,
  codicon,
} from '@theia/core/lib/browser';
import { MonitorWidget } from './monitor-widget';
import { MenuModelRegistry, Command, CommandRegistry } from '@theia/core';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { nls } from '@theia/core/lib/common';
import { Event } from '@theia/core/lib/common/event';
import { MonitorModel } from '../../monitor-model';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import {
  ArduinoPreferences,
  defaultMonitorWidgetDockPanel,
  isMonitorWidgetDockPanel,
} from '../../arduino-preferences';
import { serialMonitorWidgetLabel } from '../../../common/nls';

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
    export const COPY_OUTPUT = Command.toLocalizedCommand(
      {
        id: 'serial-monitor-copy-output',
        label: 'Copy Output',
        iconClass: codicon('copy'),
      },
      'arduino/serial/copyOutput'
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
  static readonly RESET_SERIAL_MONITOR = MonitorWidget.ID + ':reset';

  @inject(MonitorModel)
  private readonly model: MonitorModel;
  @inject(MonitorManagerProxyClient)
  private readonly monitorManagerProxy: MonitorManagerProxyClient;
  @inject(ArduinoPreferences)
  private readonly arduinoPreferences: ArduinoPreferences;

  private _panel: ApplicationShell.Area;

  constructor() {
    super({
      widgetId: MonitorWidget.ID,
      widgetName: serialMonitorWidgetLabel,
      defaultWidgetOptions: {
        area: defaultMonitorWidgetDockPanel,
      },
      toggleCommandId: MonitorViewContribution.TOGGLE_SERIAL_MONITOR,
      toggleKeybinding: 'CtrlCmd+Shift+M',
    });
    this._panel = defaultMonitorWidgetDockPanel;
  }

  @postConstruct()
  protected init(): void {
    this._panel =
      this.arduinoPreferences['arduino.monitor.dockPanel'] ??
      defaultMonitorWidgetDockPanel;
    this.monitorManagerProxy.onMonitorShouldReset(() => this.reset());
    this.arduinoPreferences.onPreferenceChanged((event) => {
      if (
        event.preferenceName === 'arduino.monitor.dockPanel' &&
        isMonitorWidgetDockPanel(event.newValue) &&
        event.newValue !== this._panel
      ) {
        this._panel = event.newValue;
        const widget = this.tryGetWidget();
        // reopen at the new position if opened
        if (widget) {
          widget.close();
          this.openView({ activate: true, reveal: true });
        }
      }
    });
  }

  override get defaultViewOptions(): ApplicationShell.WidgetOptions {
    const viewOptions = super.defaultViewOptions;
    return {
      ...viewOptions,
      area: this._panel,
    };
  }

  override registerMenus(menus: MenuModelRegistry): void {
    if (this.toggleCommand) {
      menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
        commandId: this.toggleCommand.id,
        label: serialMonitorWidgetLabel,
        order: '5',
      });
    }
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: 'monitor-autoscroll',
      render: () => this.renderAutoScrollButton(),
      isVisible: (widget) => widget instanceof MonitorWidget,
      onDidChange: this.model.onChange as Event<unknown> as Event<void>,
    });
    registry.registerItem({
      id: 'monitor-timestamp',
      render: () => this.renderTimestampButton(),
      isVisible: (widget) => widget instanceof MonitorWidget,
      onDidChange: this.model.onChange as Event<unknown> as Event<void>,
    });
    registry.registerItem({
      id: SerialMonitor.Commands.CLEAR_OUTPUT.id,
      command: SerialMonitor.Commands.CLEAR_OUTPUT.id,
      tooltip: nls.localize(
        'vscode/output.contribution/clearOutput.label',
        'Clear Output'
      ),
    });
    registry.registerItem({
      id: SerialMonitor.Commands.COPY_OUTPUT.id,
      command: SerialMonitor.Commands.COPY_OUTPUT.id,
      tooltip: nls.localize(
        'arduino/serial/copyOutput',
        'Copy Output'
      ),
    });
  }

  override registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(SerialMonitor.Commands.CLEAR_OUTPUT, {
      isEnabled: (widget) => widget instanceof MonitorWidget,
      isVisible: (widget) => widget instanceof MonitorWidget,
      execute: (widget) => {
        if (widget instanceof MonitorWidget) {
          widget.clearConsole();
        }
      },
    });
    commands.registerCommand(SerialMonitor.Commands.COPY_OUTPUT, {
      isEnabled: (widget) => widget instanceof MonitorWidget,
      isVisible: (widget) => widget instanceof MonitorWidget,
      execute: (widget) => {
        if (widget instanceof MonitorWidget) {
          widget.copyOutput();
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
    commands.registerCommand(
      { id: MonitorViewContribution.RESET_SERIAL_MONITOR },
      { execute: () => this.reset() }
    );
  }

  protected async toggle(): Promise<void> {
    const widget = this.tryGetWidget();
    if (widget) {
      widget.dispose();
    } else {
      await this.openView({ activate: true, reveal: true });
    }
  }

  protected async reset(): Promise<void> {
    const widget = this.tryGetWidget();
    if (widget) {
      widget.reset();
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
