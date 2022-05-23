import { Emitter, Event } from '@theia/core';
import {
  FrontendApplicationContribution,
  LocalStorageService,
} from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MonitorManagerProxyClient } from '../common/protocol';
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
    MonitorModel.State.Change<keyof MonitorModel.State>
  >;

  protected _autoscroll: boolean;
  protected _timestamp: boolean;
  protected _lineEnding: MonitorModel.EOL;
  protected _interpolate: boolean;

  constructor() {
    this._autoscroll = true;
    this._timestamp = false;
    this._interpolate = false;
    this._lineEnding = MonitorModel.EOL.DEFAULT;

    this.onChangeEmitter = new Emitter<
      MonitorModel.State.Change<keyof MonitorModel.State>
    >();
  }

  onStart(): void {
    this.localStorageService
      .getData<MonitorModel.State>(MonitorModel.STORAGE_ID)
      .then(this.restoreState.bind(this));

    this.monitorManagerProxy.onMonitorSettingsDidChange(
      this.onMonitorSettingsDidChange.bind(this)
    );
  }

  get onChange(): Event<MonitorModel.State.Change<keyof MonitorModel.State>> {
    return this.onChangeEmitter.event;
  }

  protected restoreState(state: MonitorModel.State): void {
    if (!state) {
      return;
    }
    this._autoscroll = state.autoscroll;
    this._timestamp = state.timestamp;
    this._lineEnding = state.lineEnding;
    this._interpolate = state.interpolate;
  }

  protected async storeState(): Promise<void> {
    return this.localStorageService.setData(MonitorModel.STORAGE_ID, {
      autoscroll: this._autoscroll,
      timestamp: this._timestamp,
      lineEnding: this._lineEnding,
      interpolate: this._interpolate,
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

  get lineEnding(): MonitorModel.EOL {
    return this._lineEnding;
  }

  set lineEnding(lineEnding: MonitorModel.EOL) {
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

  protected onMonitorSettingsDidChange = (settings: MonitorSettings): void => {
    const { monitorUISettings } = settings;
    if (!monitorUISettings) return;
    const { autoscroll, interpolate, lineEnding, timestamp } =
      monitorUISettings;

    if (!isNullOrUndefined(autoscroll)) this.autoscroll = autoscroll;
    if (!isNullOrUndefined(interpolate)) this.interpolate = interpolate;
    if (!isNullOrUndefined(lineEnding)) this.lineEnding = lineEnding;
    if (!isNullOrUndefined(timestamp)) this.timestamp = timestamp;
  };
}

// TODO: Move this to /common
export namespace MonitorModel {
  export interface State {
    autoscroll: boolean;
    timestamp: boolean;
    lineEnding: EOL;
    interpolate: boolean;
  }
  export namespace State {
    export interface Change<K extends keyof State> {
      readonly property: K;
      readonly value: State[K];
    }
  }

  export type EOL = '' | '\n' | '\r' | '\r\n';
  export namespace EOL {
    export const DEFAULT: EOL = '\n';
  }
}
