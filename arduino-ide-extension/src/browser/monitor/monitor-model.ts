import { injectable } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MonitorConfig } from '../../common/protocol/monitor-service';

@injectable()
export class MonitorModel {

    protected readonly onChangeEmitter: Emitter<void>;
    protected _autoscroll: boolean;
    protected _timestamp: boolean;
    protected _baudRate: MonitorConfig.BaudRate;
    protected _lineEnding: MonitorModel.EOL;

    constructor() {
        this._autoscroll = true;
        this._timestamp = false;
        this._baudRate = MonitorConfig.BaudRate.DEFAULT;
        this._lineEnding = MonitorModel.EOL.DEFAULT;
        this.onChangeEmitter = new Emitter<void>();
    }

    get onChange(): Event<void> {
        return this.onChangeEmitter.event;
    }

    get autoscroll(): boolean {
        return this._autoscroll;
    }

    toggleAutoscroll(): void {
        this._autoscroll = !this._autoscroll;
    }

    get timestamp(): boolean {
        return this._timestamp;
    }

    toggleTimestamp(): void {
        this._timestamp = !this._timestamp;
    }

    get baudRate(): MonitorConfig.BaudRate {
        return this._baudRate;
    }

    set baudRate(baudRate: MonitorConfig.BaudRate) {
        this._baudRate = baudRate;
        this.onChangeEmitter.fire(undefined);
    }

    get lineEnding(): MonitorModel.EOL {
        return this._lineEnding;
    }

    set lineEnding(lineEnding: MonitorModel.EOL) {
        this._lineEnding = lineEnding;
        this.onChangeEmitter.fire(undefined);
    }

    restore(state: MonitorModel.State) {
        this._autoscroll = state.autoscroll;
        this._timestamp = state.timestamp;
        this._baudRate = state.baudRate;
        this._lineEnding = state.lineEnding;
        this.onChangeEmitter.fire(undefined);
    }

    store(): MonitorModel.State {
        return {
            autoscroll: this._autoscroll,
            timestamp: this._timestamp,
            baudRate: this._baudRate,
            lineEnding: this._lineEnding
        }
    }

}

export namespace MonitorModel {

    export interface State {
        autoscroll: boolean;
        timestamp: boolean;
        baudRate: MonitorConfig.BaudRate;
        lineEnding: EOL;
    }

    export type EOL = '' | '\n' | '\r' | '\r\n';
    export namespace EOL {
        export const DEFAULT: EOL = '\n';
    }

}
