import { injectable } from "inversify";
import { Emitter } from "@theia/core";

export namespace MonitorModel {
    export interface Data {
        autoscroll: boolean,
        timestamp: boolean
    }
}

@injectable()
export class MonitorModel {

    protected readonly onChangeEmitter = new Emitter<void>();

    readonly onChange = this.onChangeEmitter.event;

    protected _autoscroll: boolean = true;
    protected _timestamp: boolean = false;

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
    }

    store(): MonitorModel.Data {
        return {
            autoscroll: this._autoscroll,
            timestamp: this._timestamp
        }
    }
}