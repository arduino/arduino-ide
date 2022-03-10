import { Emitter, Event } from "@theia/core";
import { FrontendApplicationContribution, LocalStorageService } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";

@injectable()
export class MonitorModel implements FrontendApplicationContribution {
    protected static STORAGE_ID = 'arduino-monitor-model';

    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;

    protected readonly onChangeEmitter: Emitter<MonitorModel.State.Change<keyof MonitorModel.State>>;

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
            .then(this.restoreState);
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

    toggleAutoscroll(): void {
        this._autoscroll = !this._autoscroll;
        this.storeState().then(() => {
            this.onChangeEmitter.fire({
                property: 'autoscroll',
                value: this._timestamp
            });
        });
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

    get lineEnding(): MonitorModel.EOL {
        return this._lineEnding;
    }

    set lineEnding(lineEnding: MonitorModel.EOL) {
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
}

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
