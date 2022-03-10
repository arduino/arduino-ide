import * as React from 'react';
import { postConstruct, injectable, inject } from 'inversify';
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
import { nls } from '@theia/core/lib/common';
import {
  MonitorManagerProxyClient,
  MonitorSettings,
} from '../../../common/protocol';
import { MonitorModel } from '../../monitor-model';

@injectable()
export class MonitorWidget extends ReactWidget {
  static readonly LABEL = nls.localize(
    'arduino/common/serialMonitor',
    'Serial Monitor'
  );
  static readonly ID = 'serial-monitor';

  @inject(MonitorModel)
  protected readonly monitorModel: MonitorModel;

  @inject(MonitorManagerProxyClient)
  protected readonly monitorManagerProxy: MonitorManagerProxyClient;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

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

  constructor() {
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

    this.toDispose.push(
      this.boardsServiceProvider.onBoardsConfigChanged(
        async ({ selectedBoard, selectedPort }) => {
          if (selectedBoard && selectedBoard.fqbn && selectedPort) {
            await this.monitorManagerProxy.startMonitor(
              selectedBoard,
              selectedPort
            );
          }
        }
      )
    );
  }

  @postConstruct()
  protected init(): void {
    this.update();
    this.toDispose.push(this.monitorModel.onChange(() => this.update()));
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

  private getCurrentSettings(): MonitorSettings {
    const board = this.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.boardsServiceProvider.boardsConfig.selectedPort;
    if (!board || !port) {
      return {};
    }
    return this.monitorManagerProxy.getCurrentSettings(board, port);
  }

  //////////////////////////////////////////////////
  ////////////////////IMPORTANT/////////////////////
  //////////////////////////////////////////////////
  // baudRates and selectedBaudRates as of now are hardcoded
  // like this to retrieve the baudrate settings from the ones
  // received by the monitor.
  // We're doing it like since the frontend as of now doesn't
  // support a fully customizable list of options that would
  // be require to support pluggable monitors completely.
  // As soon as the frontend UI is updated to support
  // any custom settings this methods MUST be removed and
  // made generic.
  //
  // This breaks if the user tries to open a monitor that
  // doesn't support the baudrate setting.
  protected get baudRates(): string[] {
    const settings = this.getCurrentSettings();
    const baudRateSettings = settings['baudrate'];
    if (!baudRateSettings) {
      return [];
    }
    return baudRateSettings.values;
  }

  protected get selectedBaudRate(): string {
    const settings = this.getCurrentSettings();
    const baudRateSettings = settings['baudrate'];
    if (!baudRateSettings) {
      return '';
    }
    return baudRateSettings.selectedValue;
  }

  protected render(): React.ReactNode {
    const { baudRates, lineEndings } = this;
    const lineEnding =
      lineEndings.find((item) => item.value === this.monitorModel.lineEnding) ||
      lineEndings[1]; // Defaults to `\n`.
    const baudRate = baudRates.find((item) => item === this.selectedBaudRate);
    return (
      <div className="serial-monitor">
        <div className="head">
          <div className="send">
            <SerialMonitorSendInput
              boardsServiceProvider={this.boardsServiceProvider}
              monitorManagerProxy={this.monitorManagerProxy}
              resolveFocus={this.onFocusResolved}
              onSend={this.onSend}
            />
          </div>
          <div className="config">
            <div className="select">
              <ArduinoSelect
                maxMenuHeight={this.widgetHeight - 40}
                options={lineEndings}
                value={lineEnding}
                onChange={this.onChangeLineEnding}
              />
            </div>
            <div className="select">
              <ArduinoSelect
                className="select"
                maxMenuHeight={this.widgetHeight - 40}
                options={baudRates}
                value={baudRate}
                onChange={this.onChangeBaudRate}
              />
            </div>
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
  ) => {
    this.monitorModel.lineEnding = option.value;
  };

  protected readonly onChangeBaudRate = (value: string) => {
    const settings = this.getCurrentSettings();
    settings['baudrate'].selectedValue = value;
    this.monitorManagerProxy.changeSettings(settings);
  };
}
