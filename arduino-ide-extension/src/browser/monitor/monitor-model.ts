import { injectable, inject } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MonitorConfig } from '../../common/protocol/monitor-service';
import { FrontendApplicationContribution, LocalStorageService } from '@theia/core/lib/browser';
import { BoardsServiceProvider } from '../boards/boards-service-provider';

@injectable()
export class MonitorModel implements FrontendApplicationContribution {

    protected static STORAGE_ID = 'arduino-monitor-model';

    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClient: BoardsServiceProvider;

    protected readonly onChangeEmitter: Emitter<MonitorModel.State.Change<keyof MonitorModel.State>>;
    protected _autoscroll: boolean;
    protected _timestamp: boolean;
    protected _baudRate: MonitorConfig.BaudRate;
    protected _lineEnding: MonitorModel.EOL;

    constructor() {
        this._autoscroll = true;
        this._timestamp = false;
        this._baudRate = MonitorConfig.BaudRate.DEFAULT;
        this._lineEnding = MonitorModel.EOL.DEFAULT;
        this.onChangeEmitter = new Emitter<MonitorModel.State.Change<keyof MonitorModel.State>>();
    }

    onStart(): void {
        this.localStorageService.getData<MonitorModel.State>(MonitorModel.STORAGE_ID).then(state => {
            if (state) {
                this.restoreState(state);
            }
        });
    }

    get onChange(): Event<MonitorModel.State.Change<keyof MonitorModel.State>> {
        return this.onChangeEmitter.event;
    }

    get autoscroll(): boolean {
        return this._autoscroll;
    }

    toggleAutoscroll(): void {
        this._autoscroll = !this._autoscroll;
        this.storeState();
        this.storeState().then(() => this.onChangeEmitter.fire({ property: 'autoscroll', value: this._autoscroll }));
    }

    get timestamp(): boolean {
        return this._timestamp;
    }

    toggleTimestamp(): void {
        this._timestamp = !this._timestamp;
        this.storeState().then(() => this.onChangeEmitter.fire({ property: 'timestamp', value: this._timestamp }));
    }

    get baudRate(): MonitorConfig.BaudRate {
        return this._baudRate;
    }

    set baudRate(baudRate: MonitorConfig.BaudRate) {
        this._baudRate = baudRate;
        this.storeState().then(() => this.onChangeEmitter.fire({ property: 'baudRate', value: this._baudRate }));
    }

    get lineEnding(): MonitorModel.EOL {
        return this._lineEnding;
    }

    set lineEnding(lineEnding: MonitorModel.EOL) {
        this._lineEnding = lineEnding;
        this.storeState().then(() => this.onChangeEmitter.fire({ property: 'lineEnding', value: this._lineEnding }));
    }

    protected restoreState(state: MonitorModel.State): void {
        this._autoscroll = state.autoscroll;
        this._timestamp = state.timestamp;
        this._baudRate = state.baudRate;
        this._lineEnding = state.lineEnding;
    }

    protected async storeState(): Promise<void> {
        return this.localStorageService.setData(MonitorModel.STORAGE_ID, {
            autoscroll: this._autoscroll,
            timestamp: this._timestamp,
            baudRate: this._baudRate,
            lineEnding: this._lineEnding
        });
    }

}

export namespace MonitorModel {

    export interface State {
        autoscroll: boolean;
        timestamp: boolean;
        baudRate: MonitorConfig.BaudRate;
        lineEnding: EOL;
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
