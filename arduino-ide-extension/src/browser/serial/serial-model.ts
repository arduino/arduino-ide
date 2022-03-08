import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { SerialConfig } from '../../common/protocol';
import {
  FrontendApplicationContribution,
  LocalStorageService,
} from '@theia/core/lib/browser';
import { BoardsServiceProvider } from '../boards/boards-service-provider';

@injectable()
export class SerialModel implements FrontendApplicationContribution {
  protected static STORAGE_ID = 'arduino-serial-model';

  @inject(LocalStorageService)
  protected readonly localStorageService: LocalStorageService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClient: BoardsServiceProvider;

  protected readonly onChangeEmitter: Emitter<
    SerialModel.State.Change<keyof SerialModel.State>
  >;
  protected _autoscroll: boolean;
  protected _timestamp: boolean;
  protected _baudRate: SerialConfig.BaudRate;
  protected _lineEnding: SerialModel.EOL;
  protected _interpolate: boolean;

  constructor() {
    this._autoscroll = true;
    this._timestamp = false;
    this._baudRate = SerialConfig.BaudRate.DEFAULT;
    this._lineEnding = SerialModel.EOL.DEFAULT;
    this._interpolate = false;
    this.onChangeEmitter = new Emitter<
      SerialModel.State.Change<keyof SerialModel.State>
    >();
  }

  onStart(): void {
    this.localStorageService
      .getData<SerialModel.State>(SerialModel.STORAGE_ID)
      .then((state) => {
        if (state) {
          this.restoreState(state);
        }
      });
  }

  get onChange(): Event<SerialModel.State.Change<keyof SerialModel.State>> {
    return this.onChangeEmitter.event;
  }

  get autoscroll(): boolean {
    return this._autoscroll;
  }

  toggleAutoscroll(): void {
    this._autoscroll = !this._autoscroll;
    this.storeState();
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'autoscroll',
        value: this._autoscroll,
      })
    );
  }

  get timestamp(): boolean {
    return this._timestamp;
  }

  toggleTimestamp(): void {
    this._timestamp = !this._timestamp;
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'timestamp',
        value: this._timestamp,
      })
    );
  }

  get baudRate(): SerialConfig.BaudRate {
    return this._baudRate;
  }

  set baudRate(baudRate: SerialConfig.BaudRate) {
    this._baudRate = baudRate;
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'baudRate',
        value: this._baudRate,
      })
    );
  }

  get lineEnding(): SerialModel.EOL {
    return this._lineEnding;
  }

  set lineEnding(lineEnding: SerialModel.EOL) {
    this._lineEnding = lineEnding;
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

  set interpolate(i: boolean) {
    this._interpolate = i;
    this.storeState().then(() =>
      this.onChangeEmitter.fire({
        property: 'interpolate',
        value: this._interpolate,
      })
    );
  }

  protected restoreState(state: SerialModel.State): void {
    this._autoscroll = state.autoscroll;
    this._timestamp = state.timestamp;
    this._baudRate = state.baudRate;
    this._lineEnding = state.lineEnding;
    this._interpolate = state.interpolate;
  }

  protected async storeState(): Promise<void> {
    return this.localStorageService.setData(SerialModel.STORAGE_ID, {
      autoscroll: this._autoscroll,
      timestamp: this._timestamp,
      baudRate: this._baudRate,
      lineEnding: this._lineEnding,
      interpolate: this._interpolate,
    });
  }
}

export namespace SerialModel {
  export interface State {
    autoscroll: boolean;
    timestamp: boolean;
    baudRate: SerialConfig.BaudRate;
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
