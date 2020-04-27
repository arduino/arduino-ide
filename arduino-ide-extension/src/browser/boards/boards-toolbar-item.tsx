import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Port } from '../../common/protocol';
import { BoardsConfig } from './boards-config';
import { ArduinoCommands } from '../arduino-commands';
import { BoardsServiceClientImpl, AvailableBoard } from './boards-service-client-impl';

export interface BoardsDropDownListCoords {
    readonly top: number;
    readonly left: number;
    readonly width: number;
    readonly paddingTop: number;
}

export namespace BoardsDropDown {
    export interface Props {
        readonly coords: BoardsDropDownListCoords | 'hidden';
        readonly items: Array<AvailableBoard & { onClick: () => void, port: Port }>;
        readonly openBoardsConfig: () => void;
    }
}

export class BoardsDropDown extends React.Component<BoardsDropDown.Props> {

    protected dropdownElement: HTMLElement;

    constructor(props: BoardsDropDown.Props) {
        super(props);

        let list = document.getElementById('boards-dropdown-container');
        if (!list) {
            list = document.createElement('div');
            list.id = 'boards-dropdown-container';
            document.body.appendChild(list);
            this.dropdownElement = list;
        }
    }

    render(): React.ReactNode {
        return ReactDOM.createPortal(this.renderNode(), this.dropdownElement);
    }

    protected renderNode(): React.ReactNode {
        const { coords, items } = this.props;
        if (coords === 'hidden') {
            return '';
        }
        return <div className='arduino-boards-dropdown-list'
            style={{
                position: 'absolute',
                ...coords
            }}>
            {this.renderItem({
                label: 'Select Other Board & Port',
                onClick: () => this.props.openBoardsConfig()
            })}
            {items.map(({ name, port, selected, onClick }) => ({ label: `${name} at ${Port.toString(port)}`, selected, onClick })).map(this.renderItem)}
        </div>
    }

    protected renderItem({ label, selected, onClick }: { label: string, selected?: boolean, onClick: () => void }): React.ReactNode {
        return <div key={label} className={`arduino-boards-dropdown-item ${selected ? 'selected' : ''}`} onClick={onClick}>
            <div>
                {label}
            </div>
            {selected ? <span className='fa fa-check' /> : ''}
        </div>
    }

}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, BoardsToolBarItem.State> {

    static TOOLBAR_ID: 'boards-toolbar';

    protected readonly toDispose: DisposableCollection = new DisposableCollection();

    constructor(props: BoardsToolBarItem.Props) {
        super(props);

        const { availableBoards } = props.boardsServiceClient;
        this.state = {
            availableBoards,
            coords: 'hidden'
        };

        document.addEventListener('click', () => {
            this.setState({ coords: 'hidden' });
        });
    }

    componentDidMount() {
        this.props.boardsServiceClient.onAvailableBoardsChanged(availableBoards => this.setState({ availableBoards }));
    }

    componentWillUnmount(): void {
        this.toDispose.dispose();
    }

    protected readonly show = (event: React.MouseEvent<HTMLElement>) => {
        const { currentTarget: element } = event;
        if (element instanceof HTMLElement) {
            if (this.state.coords === 'hidden') {
                const rect = element.getBoundingClientRect();
                this.setState({
                    coords: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        paddingTop: rect.height
                    }
                });
            } else {
                this.setState({ coords: 'hidden' });
            }
        }
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    };

    render(): React.ReactNode {
        const { coords, availableBoards } = this.state;
        const boardsConfig = this.props.boardsServiceClient.boardsConfig;
        const title = BoardsConfig.Config.toString(boardsConfig, { default: 'no board selected' });
        const decorator = (() => {
            const selectedBoard = availableBoards.find(({ selected }) => selected);
            if (!selectedBoard || !selectedBoard.port) {
                return 'fa fa-times notAttached'
            }
            if (selectedBoard.state === AvailableBoard.State.guessed) {
                return 'fa fa-exclamation-triangle guessed'
            }
            return ''
        })();

        return <React.Fragment>
            <div className='arduino-boards-toolbar-item-container'>
                <div className='arduino-boards-toolbar-item' title={title}>
                    <div className='inner-container' onClick={this.show}>
                        <span className={decorator} />
                        <div className='label noWrapInfo'>
                            <div className='noWrapInfo noselect'>
                                {title}
                            </div>
                        </div>
                        <span className='fa fa-caret-down caret' />
                    </div>
                </div>
            </div>
            <BoardsDropDown
                coords={coords}
                items={availableBoards.filter(AvailableBoard.hasPort).map(board => ({
                    ...board,
                    onClick: () => {
                        if (board.state === AvailableBoard.State.incomplete) {
                            this.props.boardsServiceClient.boardsConfig = {
                                selectedPort: board.port
                            };
                            this.openDialog();
                        } else {
                            this.props.boardsServiceClient.boardsConfig = {
                                selectedBoard: board,
                                selectedPort: board.port
                            }
                        }
                    }
                }))}
                openBoardsConfig={this.openDialog}>
            </BoardsDropDown>
        </React.Fragment>;
    }

    protected openDialog = () => {
        this.props.commands.executeCommand(ArduinoCommands.OPEN_BOARDS_DIALOG.id);
        this.setState({ coords: 'hidden' });
    };

}
export namespace BoardsToolBarItem {

    export interface Props {
        readonly boardsServiceClient: BoardsServiceClientImpl;
        readonly commands: CommandRegistry;
    }

    export interface State {
        availableBoards: AvailableBoard[];
        coords: BoardsDropDownListCoords | 'hidden';
    }

}
