import * as React from 'react';
import { BoardsService, Board } from '../../common/protocol/boards-service';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { ArduinoToolbarContextMenu } from '../arduino-file-menu';
import { BoardsNotificationService } from '../boards-notification-service';

export namespace BoardsToolBarItem {
    export interface Props {
        readonly contextMenuRenderer: ContextMenuRenderer;
        readonly boardsNotificationService: BoardsNotificationService;
        readonly boardService: BoardsService;
    }

    export interface State {
        selectedBoard?: Board;
        selectedIsAttached: boolean
    }
}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, BoardsToolBarItem.State> {

    protected attachedBoards: Board[];

    constructor(props: BoardsToolBarItem.Props) {
        super(props);

        this.state = {
            selectedBoard: undefined,
            selectedIsAttached: true
        };
    }

    componentDidMount() {
        this.setAttachedBoards();
    }

    protected async setAttachedBoards() {
        const { boards } = await this.props.boardService.getAttachedBoards();
        this.attachedBoards = boards;
        if(this.attachedBoards.length){
            await this.props.boardService.selectBoard(this.attachedBoards[0]);
            this.setSelectedBoard(this.attachedBoards[0]);
        }
    }

    setSelectedBoard(board: Board) {
        if (this.attachedBoards.length) {
            this.setState({ selectedIsAttached: !!this.attachedBoards.find(attachedBoard => attachedBoard.name === board.name) });
        }
        this.setState({ selectedBoard: board });
    }

    protected readonly doShowSelectBoardsMenu = (event: React.MouseEvent<HTMLElement>) => this.showSelectBoardsMenu(event);
    protected showSelectBoardsMenu(event: React.MouseEvent<HTMLElement>) {
        const el = (event.target as HTMLElement).parentElement;
        if (el) {
            this.props.contextMenuRenderer.render(ArduinoToolbarContextMenu.SELECT_BOARDS_PATH, {
                x: el.getBoundingClientRect().left,
                y: el.getBoundingClientRect().top + el.offsetHeight
            });
        }
    }

    render(): React.ReactNode {
        return <React.Fragment>
            <div className='arduino-boards-toolbar-item-container' onClick={this.doShowSelectBoardsMenu}>
                <div className='arduino-boards-toolbar-item'>
                    <div className='inner-container'>
                        <span className={!this.state.selectedBoard || !this.state.selectedIsAttached ? 'fa fa-times notAttached' : ''}></span>
                        <div className='label'>{this.state.selectedBoard ? this.state.selectedBoard.name : 'no board selected'}</div>
                        <span className='fa fa-caret-down'></span>
                    </div>
                </div>
            </div>
        </React.Fragment>;
    }
}