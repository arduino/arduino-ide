import { Emitter, Event } from '@theia/core';
import {
  FrontendApplicationContribution,
  LocalStorageService,
} from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  isMonitorConnected,
  MonitorConnectionStatus,
  monitorConnectionStatusEquals,
  MonitorEOL,
  MonitorManagerProxyClient,
  MonitorState,
} from '../common/protocol';
import { isNullOrUndefined } from '../common/utils';
import { MonitorSettings } from '../node/monitor-settings/monitor-settings-provider';

@injectable()
export class MonitorModel implements FrontendApplicationContribution {
  protected static STORAGE_ID = 'arduino-monitor-model';

  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;

  @inject(MonitorManagerProxyClient)
  protected readonly monitorManagerProxy: MonitorManagerProxyClient;

  protected readonly onChangeEmitter: Emitter<
    MonitorState.Change<keyof MonitorState>
  >;

  protected _autoscroll: boolean;
  protected _timestamp: boolean;
  protected _lineEnding: MonitorEOL;
  protected _interpolate: boolean;
  protected _darkTheme: boolean;
  protected _wsPort: number;
  protected _serialPort: string;
  protected _connectionStatus: MonitorConnectionStatus;

  constructor() {
    this._autoscroll = true;
    this._timestamp = false;
    this._interpolate = false;
    this._lineEnding = MonitorEOL.DEFAULT;
    this._darkTheme = false;
    this._wsPort = 0;
    this._serialPort = '';
    this._connectionStatus = 'not-connected';

    this.onChangeEmitter = new Emitter<
      MonitorState.Change<keyof MonitorState>
    >();
  }

  onStart(): void {
    this.localStorageService
      .getData<MonitorState>(MonitorModel.STORAGE_ID)
      .then(this.restoreState.bind(this));

    this.monitorManagerProxy.onMonitorSettingsDidChange(
      this.onMonitorSettingsDidChange.bind(this)
    );
  }

  get onChange(): Event<MonitorState.Change<keyof MonitorState>> {
    return this.onChangeEmitter.event;
  }

  protected restoreState(state: MonitorState): void {
    if (!state) {
      return;
    }
    this._autoscroll = state.autoscroll;
    this._timestamp = state.timestamp;
    this._lineEnding = state.lineEnding;
    this._interpolate = state.interpolate;
    this._serialPort = state.serialPort;
  }

  protected async storeState(): Promise<void> {
    return this.localStorageService.setData(MonitorModel.STORAGE_ID, {
      autoscroll: this._autoscroll,
      timestamp: this._timestamp,
      lineEnding: this._lineEnding,
      interpolate: this._interpolate,
      serialPort: this._serialPort,
    });
  }

  get autoscroll(): boolean {
    return this._autoscroll;
  }

  set autoscroll(autoscroll: boolean) {
    if (autoscroll === this._autoscroll) return;
    this._autoscroll = autoscroll;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { autoscroll },
    });
    this.storeState().then(() => {
      this.onChangeEmitter.fire({
        property: 'autoscroll',
        value: this._autoscroll,
      });
    });
  }

  toggleAutoscroll(): void {
    this.autoscroll = !this._autoscroll;
  }

  get timestamp(): boolean {
    return this._timestamp;
  }

  set timestamp(timestamp: boolean) {
    if (timestamp === this._timestamp) return;
    this._timestamp = timestamp;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { timestamp },
    });
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'timestamp',
        value: this._timestamp,
      })
    );
  }

  toggleTimestamp(): void {
    this.timestamp = !this._timestamp;
  }

  get lineEnding(): MonitorEOL {
    return this._lineEnding;
  }

  set lineEnding(lineEnding: MonitorEOL) {
    if (lineEnding === this._lineEnding) return;
    this._lineEnding = lineEnding;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { lineEnding },
    });
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'lineEnding',
        value: this._lineEnding,
      })
    );
  }

  get interpolate(): boolean {
    return this._interpolate;
  }

  set interpolate(interpolate: boolean) {
    if (interpolate === this._interpolate) return;
    this._interpolate = interpolate;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { interpolate },
    });
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'interpolate',
        value: this._interpolate,
      })
    );
  }

  get darkTheme(): boolean {
    return this._darkTheme;
  }

  set darkTheme(darkTheme: boolean) {
    if (darkTheme === this._darkTheme) return;
    this._darkTheme = darkTheme;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { darkTheme },
    });
    this.onChangeEmitter.fire({
      property: 'darkTheme',
      value: this._darkTheme,
    });
  }

  get wsPort(): number {
    return this._wsPort;
  }

  set wsPort(wsPort: number) {
    if (wsPort === this._wsPort) return;
    this._wsPort = wsPort;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { wsPort },
    });
    this.onChangeEmitter.fire({
      property: 'wsPort',
      value: this._wsPort,
    });
  }

  get serialPort(): string {
    return this._serialPort;
  }

  set serialPort(serialPort: string) {
    if (serialPort === this._serialPort) return;
    this._serialPort = serialPort;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: { serialPort },
    });
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'serialPort',
        value: this._serialPort,
      })
    );
  }

  get connectionStatus(): MonitorConnectionStatus {
    return this._connectionStatus;
  }

  set connectionStatus(connectionStatus: MonitorConnectionStatus) {
    if (
      monitorConnectionStatusEquals(connectionStatus, this.connectionStatus)
    ) {
      return;
    }
    this._connectionStatus = connectionStatus;
    this.monitorManagerProxy.changeSettings({
      monitorUISettings: {
        connectionStatus,
        connected: isMonitorConnected(connectionStatus),
      },
    });
    this.onChangeEmitter.fire({
      property: 'connectionStatus',
      value: this._connectionStatus,
    });
  }

  protected onMonitorSettingsDidChange = (settings: MonitorSettings): void => {
    const { monitorUISettings } = settings;
    if (!monitorUISettings) return;
    const {
      autoscroll,
      interpolate,
      lineEnding,
      timestamp,
      darkTheme,
      wsPort,
      serialPort,
      connectionStatus,
    } = monitorUISettings;

    if (!isNullOrUndefined(autoscroll)) this.autoscroll = autoscroll;
    if (!isNullOrUndefined(interpolate)) this.interpolate = interpolate;
    if (!isNullOrUndefined(lineEnding)) this.lineEnding = lineEnding;
    if (!isNullOrUndefined(timestamp)) this.timestamp = timestamp;
    if (!isNullOrUndefined(darkTheme)) this.darkTheme = darkTheme;
    if (!isNullOrUndefined(wsPort)) this.wsPort = wsPort;
    if (!isNullOrUndefined(serialPort)) this.serialPort = serialPort;
    if (!isNullOrUndefined(connectionStatus))
      this.connectionStatus = connectionStatus;
  };
}
