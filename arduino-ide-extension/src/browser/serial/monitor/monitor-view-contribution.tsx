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
import { MessageService } from '@theia/core/lib/common/message-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import dateFormat from 'dateformat';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { nls } from '@theia/core/lib/common';
import { Event } from '@theia/core/lib/common/event';
import { MonitorModel } from '../../monitor-model';
import {
  FileSystemExt,
  MonitorManagerProxyClient,
} from '../../../common/protocol';
import { DialogService } from '../../dialog-service';
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
    export const COPY_OUTPUT = {
      id: 'serial-monitor-copy-output',
    };
    export const SAVE_OUTPUT = {
      id: 'serial-monitor-save-output',
    };
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
  @inject(DialogService)
  private readonly dialogService: DialogService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileSystemExt)
  private readonly fileSystemExt: FileSystemExt;
  @inject(EnvVariablesServer)
  private readonly envVariablesServer: EnvVariablesServer;
  @inject(MessageService)
  private readonly messageService: MessageService;

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
      icon: codicon('copy'),
      tooltip: nls.localize('arduino/serial/copyOutput', 'Copy Output'),
    });
    registry.registerItem({
      id: SerialMonitor.Commands.SAVE_OUTPUT.id,
      command: SerialMonitor.Commands.SAVE_OUTPUT.id,
      icon: codicon('save-as'),
      tooltip: nls.localize('arduino/serial/saveOutput', 'Save Output'),
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
    commands.registerCommand(SerialMonitor.Commands.SAVE_OUTPUT, {
      isEnabled: (widget) => widget instanceof MonitorWidget,
      isVisible: (widget) => widget instanceof MonitorWidget,
      execute: (widget) => {
        if (widget instanceof MonitorWidget) {
          return this.saveOutput(widget);
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

  protected async saveOutput(widget: MonitorWidget): Promise<void> {
    // Capture the output before showing the dialog; the buffer keeps
    // changing while the dialog is open.
    const plainText = widget.outputText();
    const csvText = widget.outputCsvText();
    const homeDirUri = new URI(await this.envVariablesServer.getHomeDirUri());
    const defaultUri = homeDirUri.resolve(
      `serial-monitor-${dateFormat(new Date(), 'yyyymmdd-HHMMss')}.txt`
    );
    const defaultPath = await this.fileService.fsPath(defaultUri);
    const { filePath, canceled } = await this.dialogService.showSaveDialog({
      title: nls.localize(
        'arduino/serial/saveOutputAs',
        'Save Serial Monitor output as...'
      ),
      defaultPath,
      filters: [
        {
          name: nls.localize('arduino/serial/textFiles', 'Text Files'),
          extensions: ['txt', 'log'],
        },
        {
          name: nls.localize('arduino/serial/csvFiles', 'CSV Files'),
          extensions: ['csv'],
        },
        {
          name: nls.localize('arduino/serial/allFiles', 'All Files'),
          extensions: ['*'],
        },
      ],
    });
    if (canceled || !filePath) {
      return;
    }
    const text = filePath.toLowerCase().endsWith('.csv') ? csvText : plainText;
    const destinationUri = await this.fileSystemExt.getUri(filePath);
    if (!destinationUri) {
      return;
    }
    await this.fileService.write(new URI(destinationUri), text);
    this.messageService.info(
      nls.localize(
        'arduino/serial/savedOutput',
        "Saved Serial Monitor output to '{0}'.",
        filePath
      ),
      { timeout: 2000 }
    );
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
