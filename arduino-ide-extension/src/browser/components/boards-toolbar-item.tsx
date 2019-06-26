import * as React from 'react';
import { Board } from '../../common/protocol/boards-service';

export namespace BoardsToolBarItem {
    export interface Props {
        readonly onNoBoardsInstalled: () => void;
        readonly onUnknownBoard: (board: Board) => void;
    }

    export interface State {
        showOpenButton: boolean;
    }
}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, BoardsToolBarItem.State> {

    constructor(props: BoardsToolBarItem.Props) {
        super(props);

        this.state = {
            showOpenButton: false
        }
    }

    render(): React.ReactNode {

        return <React.Fragment>
            <div className='arduino-boards-toolbar-item-container' onClick={() => this.setState({ showOpenButton: !this.state.showOpenButton })}>
                <div className='arduino-boards-toolbar-item'>
                    <div className='inner-container'>
                        <div className='label'>Hallo</div>
                        {this.state.showOpenButton ? <div className='arduino-open-boards-button'> OPEN BOARDS DIALOG </div> : ''}
                    </div>
                </div>
            </div>
        </React.Fragment>;
    }
}