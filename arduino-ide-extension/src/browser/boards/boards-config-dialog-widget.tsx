import * as React from 'react';
import { injectable, inject } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import { BoardsService } from '../../common/protocol/boards-service';
import { BoardsConfig } from './boards-config';
import { BoardsServiceClientImpl } from './boards-service-client-impl';
import { CoreServiceClientImpl } from '../core-service-client-impl';
import { ArduinoDaemonClientImpl } from '../arduino-daemon-client-impl';

@injectable()
export class BoardsConfigDialogWidget extends ReactWidget {

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(CoreServiceClientImpl)
    protected readonly coreServiceClient: CoreServiceClientImpl;

    @inject(ArduinoDaemonClientImpl)
    protected readonly daemonClient: ArduinoDaemonClientImpl;

    protected readonly onBoardConfigChangedEmitter = new Emitter<BoardsConfig.Config>();
    readonly onBoardConfigChanged = this.onBoardConfigChangedEmitter.event;

    protected focusNode: HTMLElement | undefined;

    constructor() {
        super();
        this.id = 'select-board-dialog';
    }

    protected fireConfigChanged = (config: BoardsConfig.Config) => {
        this.onBoardConfigChangedEmitter.fire(config);
    }

    protected setFocusNode = (element: HTMLElement | undefined) => {
        this.focusNode = element;
    }

    protected render(): React.ReactNode {
        return <div className='selectBoardContainer'>
            <BoardsConfig
                boardsService={this.boardsService}
                boardsServiceClient={this.boardsServiceClient}
                coreServiceClient={this.coreServiceClient}
                daemonClient={this.daemonClient}
                onConfigChange={this.fireConfigChanged}
                onFocusNodeSet={this.setFocusNode} />
        </div>;
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        if (this.focusNode instanceof HTMLInputElement) {
            this.focusNode.select();
        }
        (this.focusNode || this.node).focus();
    }

}
