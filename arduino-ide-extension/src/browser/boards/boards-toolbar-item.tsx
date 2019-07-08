import * as React from 'react';
import { Board } from '../../common/protocol/boards-service';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { ArduinoToolbarContextMenu } from '../arduino-file-menu';

export namespace BoardsToolBarItem {
    export interface Props {
        readonly onNoBoardsInstalled: () => void;
        readonly onUnknownBoard: (board: Board) => void;
        readonly contextMenuRenderer: ContextMenuRenderer;
    }
}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, {}> {

    constructor(props: BoardsToolBarItem.Props) {
        super(props);
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
                        <div className='label'>Show selected Board here</div>
                    </div>
                </div>
            </div>
        </React.Fragment>;
    }
}