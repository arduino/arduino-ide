import { injectable, inject } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { MonitorConfig } from '../../common/protocol/monitor-service';
import { FrontendApplicationContribution, LocalStorageService } from '@theia/core/lib/browser';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';

@injectable()
export class MonitorModel implements FrontendApplicationContribution {

    protected static STORAGE_ID = 'arduino-monitor-model';

    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

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

    onStart(): void {
        this.localStorageService.getData<MonitorModel.State>(MonitorModel.STORAGE_ID).then(state => {
            if (state) {
                this.restoreState(state);
            }
        });
    }

    get onChange(): Event<void> {
        return this.onChangeEmitter.event;
    }

    get autoscroll(): boolean {
        return this._autoscroll;
    }

    toggleAutoscroll(): void {
        this._autoscroll = !this._autoscroll;
        this.storeState();
    }

    get timestamp(): boolean {
        return this._timestamp;
    }

    toggleTimestamp(): void {
        this._timestamp = !this._timestamp;
        this.storeState();
    }

    get baudRate(): MonitorConfig.BaudRate {
        return this._baudRate;
    }

    set baudRate(baudRate: MonitorConfig.BaudRate) {
        this._baudRate = baudRate;
        this.storeState().then(() => this.onChangeEmitter.fire(undefined));
    }

    get lineEnding(): MonitorModel.EOL {
        return this._lineEnding;
    }

    set lineEnding(lineEnding: MonitorModel.EOL) {
        this._lineEnding = lineEnding;
        this.storeState();
    }

    protected restoreState(state: MonitorModel.State) {
        this._autoscroll = state.autoscroll;
        this._timestamp = state.timestamp;
        this._baudRate = state.baudRate;
        this._lineEnding = state.lineEnding;
        this.onChangeEmitter.fire(undefined);
    }

    protected async storeState(): Promise<void> {
        this.localStorageService.setData(MonitorModel.STORAGE_ID, {
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

    export type EOL = '' | '\n' | '\r' | '\r\n';
    export namespace EOL {
        export const DEFAULT: EOL = '\n';
    }

}
