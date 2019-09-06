import { injectable } from "inversify";
import { Emitter } from "@theia/core";

export namespace MonitorModel {
    export interface Data {
        autoscroll: boolean,
        timestamp: boolean,
        baudRate: number,
        lineEnding: string
    }
}

@injectable()
export class MonitorModel {

    protected readonly onChangeEmitter = new Emitter<void>();

    readonly onChange = this.onChangeEmitter.event;

    protected _autoscroll: boolean = true;
    protected _timestamp: boolean = false;
    baudRate: number;
    lineEnding: string = '\n';

    get autoscroll(): boolean {
        return this._autoscroll;
    }

    get timestamp(): boolean {
        return this._timestamp;
    }

    toggleAutoscroll(): void {
        this._autoscroll = !this._autoscroll;
        this.onChangeEmitter.fire(undefined);
    }

    toggleTimestamp(): void {
        this._timestamp = !this._timestamp;
        this.onChangeEmitter.fire(undefined);
    }

    restore(model: MonitorModel.Data) {
        this._autoscroll = model.autoscroll;
        this._timestamp = model.timestamp;
        this.baudRate = model.baudRate;
        this.lineEnding = model.lineEnding;
    }

    store(): MonitorModel.Data {
        return {
            autoscroll: this._autoscroll,
            timestamp: this._timestamp,
            baudRate: this.baudRate,
            lineEnding: this.lineEnding
        }
    }
}