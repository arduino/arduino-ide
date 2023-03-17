import * as React from '@theia/core/shared/react';
import {
  injectable,
  inject,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
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
  MonitorEOL,
  MonitorManagerProxyClient,
} from '../../../common/protocol';
import { MonitorModel } from '../../monitor-model';
import { MonitorSettings } from '../../../node/monitor-settings/monitor-settings-provider';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

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

  @inject(MonitorModel)
  private readonly monitorModel: MonitorModel;
  @inject(MonitorManagerProxyClient)
  private readonly monitorManagerProxy: MonitorManagerProxyClient;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private readonly toDisposeOnReset: DisposableCollection;

  constructor() {
    super();
    this.id = MonitorWidget.ID;
    this.title.label = MonitorWidget.LABEL;
    this.title.iconClass = 'monitor-tab-icon';
    this.title.closable = true;
    this.scrollOptions = undefined;
    this.toDisposeOnReset = new DisposableCollection();
    this.toDispose.push(this.clearOutputEmitter);
  }

  @postConstruct()
  protected init(): void {
    this.toDisposeOnReset.dispose();
    this.toDisposeOnReset.pushAll([
      Disposable.create(() => this.monitorManagerProxy.disconnect()),
      this.monitorModel.onChange(() => this.update()),
      this.monitorManagerProxy.onMonitorSettingsDidChange((event) =>
        this.updateSettings(event)
      ),
    ]);
    this.startMonitor();
  }

  reset(): void {
    this.init();
  }

  private updateSettings(settings: MonitorSettings): void {
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

  override dispose(): void {
    this.toDisposeOnReset.dispose();
    super.dispose();
  }

  protected override onCloseRequest(msg: Message): void {
    this.closing = true;
    super.onCloseRequest(msg);
  }

  protected override onUpdateRequest(msg: Message): void {
    // TODO: `this.isAttached`
    // See: https://github.com/eclipse-theia/theia/issues/6704#issuecomment-562574713
    if (!this.closing && this.isAttached) {
      super.onUpdateRequest(msg);
    }
  }

  protected override onResize(msg: Widget.ResizeMessage): void {
    super.onResize(msg);
    this.widgetHeight = msg.height;
    this.update();
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    (this.focusNode || this.node).focus();
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.update();
  }

  protected onFocusResolved = (element: HTMLElement | undefined): void => {
    if (this.closing || !this.isAttached) {
      return;
    }
    this.focusNode = element;
    requestAnimationFrame(() =>
      MessageLoop.sendMessage(this, Widget.Msg.ActivateRequest)
    );
  };

  protected get lineEndings(): SerialMonitorOutput.SelectOption<MonitorEOL>[] {
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

  private async startMonitor(): Promise<void> {
    await this.appStateService.reachedState('ready');
    await this.boardsServiceProvider.reconciled;
    await this.syncSettings();
    await this.monitorManagerProxy.startMonitor();
  }

  private async syncSettings(): Promise<void> {
    const settings = await this.getCurrentSettings();
    this.updateSettings(settings);
  }

  private async getCurrentSettings(): Promise<MonitorSettings> {
    const board = this.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.boardsServiceProvider.boardsConfig.selectedPort;
    if (!board || !port) {
      return this.settings || {};
    }
    return this.monitorManagerProxy.getCurrentSettings(board, port);
  }

  protected render(): React.ReactNode {
    const baudrate = this.settings?.pluggableMonitorSettings
      ? this.settings.pluggableMonitorSettings.baudrate
      : undefined;

    const baudrateOptions = baudrate?.values.map((b) => ({
      label: nls.localize('arduino/monitor/baudRate', '{0} baud', b),
      value: b,
    }));
    const baudrateSelectedOption = baudrateOptions?.find(
      (b) => b.value === baudrate?.selectedValue
    );

    const lineEnding =
      this.lineEndings.find(
        (item) => item.value === this.monitorModel.lineEnding
      ) || MonitorEOL.DEFAULT;

    return (
      <div className="serial-monitor">
        <div className="head">
          <div className="send">
            <SerialMonitorSendInput
              boardsServiceProvider={this.boardsServiceProvider}
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

  protected readonly onSend = (value: string): void => this.doSend(value);
  protected doSend(value: string): void {
    this.monitorManagerProxy.send(value);
  }

  protected readonly onChangeLineEnding = (
    option: SerialMonitorOutput.SelectOption<MonitorEOL>
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
