import * as React from 'react';
import { injectable, inject } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ReactWidget, Message } from '@theia/core/lib/browser';
import { BoardsService } from '../../common/protocol/boards-service';
import { BoardsConfig } from './boards-config';
import { BoardsServiceProvider } from './boards-service-provider';
import { NotificationCenter } from '../notification-center';

@injectable()
export class BoardsConfigDialogWidget extends ReactWidget {

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClient: BoardsServiceProvider;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

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
                boardsServiceProvider={this.boardsServiceClient}
                notificationCenter={this.notificationCenter}
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
