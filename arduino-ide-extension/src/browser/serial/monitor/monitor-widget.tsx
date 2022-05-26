import * as React from 'react';
import { injectable, inject } from 'inversify';
import { OptionsType } from 'react-select/src/types';
import { Emitter } from '@theia/core/lib/common/event';
import { Disposable } from '@theia/core/lib/common/disposable';
import {
  ReactWidget,
  Message,
  Widget,
  MessageLoop,
} from '@theia/core/lib/browser/widgets';
import { ArduinoSelect } from '../../widgets/arduino-select';
import { SerialMonitorSendInput } from './serial-monitor-send-input';
import { SerialMonitorOutput } from './serial-monitor-send-output';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { CommandRegistry, nls } from '@theia/core/lib/common';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { MonitorModel } from '../../monitor-model';
import { MonitorSettings } from '../../../node/monitor-settings/monitor-settings-provider';
import { MonitorViewContribution } from './monitor-view-contribution';
import { BoardsConfig } from '../../boards/boards-config';

@injectable()
export class MonitorWidget extends ReactWidget {
  static readonly LABEL = nls.localize(
    'arduino/common/serialMonitor',
    'Serial Monitor'
  );
  static readonly ID = 'serial-monitor';

  protected settings: MonitorSettings = {};

  protected widgetHeight: number;

  /**
   * Do not touch or use it. It is for setting the focus on the `input` after the widget activation.
   */
  protected focusNode: HTMLElement | undefined;
  /**
   * Guard against re-rendering the view after the close was requested.
   * See: https://github.com/eclipse-theia/theia/issues/6704
   */
  protected closing = false;
  protected readonly clearOutputEmitter = new Emitter<void>();

  protected lastConnectedBoard: BoardsConfig.Config;

  constructor(
    @inject(MonitorModel)
    protected readonly monitorModel: MonitorModel,

    @inject(MonitorManagerProxyClient)
    protected readonly monitorManagerProxy: MonitorManagerProxyClient,

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider,

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry
  ) {
    super();
    this.id = MonitorWidget.ID;
    this.title.label = MonitorWidget.LABEL;
    this.title.iconClass = 'monitor-tab-icon';
    this.title.closable = true;
    this.scrollOptions = undefined;
    this.toDispose.push(this.clearOutputEmitter);
    this.toDispose.push(
      Disposable.create(() => this.monitorManagerProxy.disconnect())
    );

    // Start monitor right away if there is already a board/port combination selected
    const { selectedBoard, selectedPort } =
      this.boardsServiceProvider.boardsConfig;
    if (selectedBoard && selectedBoard.fqbn && selectedPort) {
      this.monitorManagerProxy.startMonitor(selectedBoard, selectedPort);
    }

    this.toDispose.push(
      this.boardsServiceProvider.onBoardsConfigChanged(
        async ({ selectedBoard, selectedPort }) => {
          if (selectedBoard && selectedBoard.fqbn && selectedPort) {
            await this.monitorManagerProxy.startMonitor(
              selectedBoard,
              selectedPort
            );

            if (
              selectedBoard.fqbn !==
                this.lastConnectedBoard?.selectedBoard?.fqbn ||
              selectedPort.id !== this.lastConnectedBoard?.selectedPort?.id
            )
              await this.commandRegistry.executeCommand(
                MonitorViewContribution.RESET_SERIAL_MONITOR
              );
            this.lastConnectedBoard = {
              selectedBoard,
              selectedPort,
            };
            this.update();
          }
        }
      )
    );
  }

  protected onBeforeAttach(msg: Message): void {
    this.update();
    this.toDispose.push(this.monitorModel.onChange(() => this.update()));
    this.getCurrentSettings().then(this.onMonitorSettingsDidChange.bind(this));
    this.monitorManagerProxy.onMonitorSettingsDidChange(
      this.onMonitorSettingsDidChange.bind(this)
    );
  }

  onMonitorSettingsDidChange(settings: MonitorSettings): void {
    this.settings = {
      ...this.settings,
      pluggableMonitorSettings: {
        ...this.settings.pluggableMonitorSettings,
        ...settings.pluggableMonitorSettings,
      },
    };
    this.update();
  }

  clearConsole(): void {
    this.clearOutputEmitter.fire(undefined);
    this.update();
  }

  dispose(): void {
    super.dispose();
  }

  onCloseRequest(msg: Message): void {
    this.closing = true;
    super.onCloseRequest(msg);
  }

  protected onUpdateRequest(msg: Message): void {
    // TODO: `this.isAttached`
    // See: https://github.com/eclipse-theia/theia/issues/6704#issuecomment-562574713
    if (!this.closing && this.isAttached) {
      super.onUpdateRequest(msg);
    }
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.widgetHeight = msg.height;
    this.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    (this.focusNode || this.node).focus();
  }

  protected onFocusResolved = (element: HTMLElement | undefined) => {
    if (this.closing || !this.isAttached) {
      return;
    }
    this.focusNode = element;
    requestAnimationFrame(() =>
      MessageLoop.sendMessage(this, Widget.Msg.ActivateRequest)
    );
  };

  protected get lineEndings(): OptionsType<
    SerialMonitorOutput.SelectOption<MonitorModel.EOL>
  > {
    return [
      {
        label: nls.localize('arduino/serial/noLineEndings', 'No Line Ending'),
        value: '',
      },
      {
        label: nls.localize('arduino/serial/newLine', 'New Line'),
        value: '\n',
      },
      {
        label: nls.localize('arduino/serial/carriageReturn', 'Carriage Return'),
        value: '\r',
      },
      {
        label: nls.localize(
          'arduino/serial/newLineCarriageReturn',
          'Both NL & CR'
        ),
        value: '\r\n',
      },
    ];
  }

  private getCurrentSettings(): Promise<MonitorSettings> {
    const board = this.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.boardsServiceProvider.boardsConfig.selectedPort;
    if (!board || !port) {
      return Promise.resolve(this.settings || {});
    }
    return this.monitorManagerProxy.getCurrentSettings(board, port);
  }

  protected render(): React.ReactNode {
    const baudrate = this.settings?.pluggableMonitorSettings
      ? this.settings.pluggableMonitorSettings.baudrate
      : undefined;

    const baudrateOptions = baudrate?.values.map((b) => ({
      label: b + ' baud',
      value: b,
    }));
    const baudrateSelectedOption = baudrateOptions?.find(
      (b) => b.value === baudrate?.selectedValue
    );

    const lineEnding =
      this.lineEndings.find(
        (item) => item.value === this.monitorModel.lineEnding
      ) || this.lineEndings[1]; // Defaults to `\n`.

    return (
      <div className="serial-monitor">
        <div className="head">
          <div className="send">
            <SerialMonitorSendInput
              boardsServiceProvider={this.boardsServiceProvider}
              monitorManagerProxy={this.monitorManagerProxy}
              monitorModel={this.monitorModel}
              resolveFocus={this.onFocusResolved}
              onSend={this.onSend}
            />
          </div>
          <div className="config">
            <div className="select">
              <ArduinoSelect
                maxMenuHeight={this.widgetHeight - 40}
                options={this.lineEndings}
                value={lineEnding}
                onChange={this.onChangeLineEnding}
              />
            </div>
            {baudrateOptions && baudrateSelectedOption && (
              <div className="select">
                <ArduinoSelect
                  className="select"
                  maxMenuHeight={this.widgetHeight - 40}
                  options={baudrateOptions}
                  value={baudrateSelectedOption}
                  onChange={this.onChangeBaudRate}
                />
              </div>
            )}
          </div>
        </div>
        <div className="body">
          <SerialMonitorOutput
            monitorModel={this.monitorModel}
            monitorManagerProxy={this.monitorManagerProxy}
            clearConsoleEvent={this.clearOutputEmitter.event}
            height={Math.floor(this.widgetHeight - 50)}
          />
        </div>
      </div>
    );
  }

  protected readonly onSend = (value: string) => this.doSend(value);
  protected async doSend(value: string): Promise<void> {
    this.monitorManagerProxy.send(value);
  }

  protected readonly onChangeLineEnding = (
    option: SerialMonitorOutput.SelectOption<MonitorModel.EOL>
  ): void => {
    this.monitorModel.lineEnding = option.value;
  };

  protected readonly onChangeBaudRate = ({
    value,
  }: {
    value: string;
  }): void => {
    this.getCurrentSettings().then(({ pluggableMonitorSettings }) => {
      if (!pluggableMonitorSettings || !pluggableMonitorSettings['baudrate'])
        return;
      const baudRateSettings = pluggableMonitorSettings['baudrate'];
      baudRateSettings.selectedValue = value;
      this.monitorManagerProxy.changeSettings({ pluggableMonitorSettings });
    });
  };
}
