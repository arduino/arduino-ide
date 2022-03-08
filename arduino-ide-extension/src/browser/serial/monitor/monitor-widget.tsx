import * as React from '@theia/core/shared/react';
import { postConstruct, injectable, inject } from '@theia/core/shared/inversify';
import { OptionsType } from 'react-select/src/types';
import { Emitter } from '@theia/core/lib/common/event';
import { Disposable } from '@theia/core/lib/common/disposable';
import {
  ReactWidget,
  Message,
  Widget,
  MessageLoop,
} from '@theia/core/lib/browser/widgets';
import { SerialConfig } from '../../../common/protocol/serial-service';
import { ArduinoSelect } from '../../widgets/arduino-select';
import { SerialModel } from '../serial-model';
import { SerialConnectionManager } from '../serial-connection-manager';
import { SerialMonitorSendInput } from './serial-monitor-send-input';
import { SerialMonitorOutput } from './serial-monitor-send-output';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { nls } from '@theia/core/lib/common';

@injectable()
export class MonitorWidget extends ReactWidget {
  static readonly LABEL = nls.localize(
    'arduino/common/serialMonitor',
    'Serial Monitor'
  );
  static readonly ID = 'serial-monitor';

  @inject(SerialModel)
  protected readonly serialModel: SerialModel;

  @inject(SerialConnectionManager)
  protected readonly serialConnection: SerialConnectionManager;

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
      Disposable.create(() => this.serialConnection.closeWStoBE())
    );
  }

  @postConstruct()
  protected init(): void {
    this.update();
    this.toDispose.push(
      this.serialConnection.onConnectionChanged(() => this.clearConsole())
    );
    this.toDispose.push(this.serialModel.onChange(() => this.update()));
  }

  clearConsole(): void {
    this.clearOutputEmitter.fire(undefined);
    this.update();
  }

  dispose(): void {
    super.dispose();
  }

  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.serialConnection.openWSToBE();
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
    SerialMonitorOutput.SelectOption<SerialModel.EOL>
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

  protected get baudRates(): OptionsType<
    SerialMonitorOutput.SelectOption<SerialConfig.BaudRate>
  > {
    const baudRates: Array<SerialConfig.BaudRate> = [
      300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200,
    ];
    return baudRates.map((baudRate) => ({
      label: baudRate + ' baud',
      value: baudRate,
    }));
  }

  protected render(): React.ReactNode {
    const { baudRates, lineEndings } = this;
    const lineEnding =
      lineEndings.find((item) => item.value === this.serialModel.lineEnding) ||
      lineEndings[1]; // Defaults to `\n`.
    const baudRate =
      baudRates.find((item) => item.value === this.serialModel.baudRate) ||
      baudRates[4]; // Defaults to `9600`.
    return (
      <div className="serial-monitor">
        <div className="head">
          <div className="send">
            <SerialMonitorSendInput
              serialConnection={this.serialConnection}
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
            serialModel={this.serialModel}
            serialConnection={this.serialConnection}
            clearConsoleEvent={this.clearOutputEmitter.event}
            height={Math.floor(this.widgetHeight - 50)}
          />
        </div>
      </div>
    );
  }

  protected readonly onSend = (value: string) => this.doSend(value);
  protected async doSend(value: string): Promise<void> {
    this.serialConnection.send(value);
  }

  protected readonly onChangeLineEnding = (
    option: SerialMonitorOutput.SelectOption<SerialModel.EOL>
  ) => {
    this.serialModel.lineEnding = option.value;
  };

  protected readonly onChangeBaudRate = (
    option: SerialMonitorOutput.SelectOption<SerialConfig.BaudRate>
  ) => {
    this.serialModel.baudRate = option.value;
  };
}
