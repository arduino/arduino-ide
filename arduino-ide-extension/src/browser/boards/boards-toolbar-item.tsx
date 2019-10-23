import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CommandRegistry, DisposableCollection } from '@theia/core';
import { BoardsService, Board, AttachedSerialBoard, Port } from '../../common/protocol/boards-service';
import { ArduinoCommands } from '../arduino-commands';
import { BoardsServiceClientImpl } from './boards-service-client-impl';
import { BoardsConfig } from './boards-config';

export interface BoardsDropDownListCoords {
    readonly top: number;
    readonly left: number;
    readonly width: number;
    readonly paddingTop: number;
}

export namespace BoardsDropDown {
    export interface Props {
        readonly coords: BoardsDropDownListCoords | 'hidden';
        readonly items: Item[];
        readonly openBoardsConfig: () => void;
    }
    export interface Item {
        readonly label: string;
        readonly selected: boolean;
        readonly onClick: () => void;
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
        items.push({
            label: 'Select Other Board & Port',
            selected: false,
            onClick: () => this.props.openBoardsConfig()
        })
        return <div className='arduino-boards-dropdown-list'
            style={{
                position: 'absolute',
                ...coords
            }}>
            {items.map(this.renderItem)}
        </div>
    }

    protected renderItem(item: BoardsDropDown.Item): React.ReactNode {
        const { label, selected, onClick } = item;
        return <div key={label} className={`arduino-boards-dropdown-item ${selected ? 'selected' : ''}`} onClick={onClick}>
            <div>
                {label}
            </div>
            {selected ? <span className='fa fa-check'/> : ''}
        </div>
    }

}

export namespace BoardsToolBarItem {

    export interface Props {
        readonly boardService: BoardsService;
        readonly boardsServiceClient: BoardsServiceClientImpl;
        readonly commands: CommandRegistry;
    }

    export interface State {
        boardsConfig: BoardsConfig.Config;
        attachedBoards: Board[];
        availablePorts: Port[];
        coords: BoardsDropDownListCoords | 'hidden';
    }
}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, BoardsToolBarItem.State> {

    static TOOLBAR_ID: 'boards-toolbar';

    protected readonly toDispose: DisposableCollection = new DisposableCollection();

    constructor(props: BoardsToolBarItem.Props) {
        super(props);

        this.state = {
            boardsConfig: this.props.boardsServiceClient.boardsConfig,
            attachedBoards: [],
            availablePorts: [],
            coords: 'hidden'
        };

        document.addEventListener('click', () => {
            this.setState({ coords: 'hidden' });
        });
    }

    componentDidMount() {
        const { boardsServiceClient: client, boardService } = this.props;
        this.toDispose.pushAll([
            client.onBoardsConfigChanged(boardsConfig => this.setState({ boardsConfig })),
            client.onBoardsChanged(({ newState }) => this.setState({ attachedBoards: newState.boards, availablePorts: newState.ports }))
        ]);
        Promise.all([
            boardService.getAttachedBoards(),
            boardService.getAvailablePorts()
        ]).then(([{boards: attachedBoards}, { ports: availablePorts }]) => {
            this.setState({ attachedBoards, availablePorts })
        });
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
                this.setState({ coords: 'hidden'});
            }
        }
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    };

    render(): React.ReactNode {
        const { boardsConfig, coords, attachedBoards, availablePorts } = this.state;
        const title = BoardsConfig.Config.toString(boardsConfig, { default: 'no board selected' });
        const configuredBoard = attachedBoards
            .filter(AttachedSerialBoard.is)
            .filter(board => availablePorts.some(port => Port.sameAs(port, board.port)))
            .filter(board => BoardsConfig.Config.sameAs(boardsConfig, board)).shift();

        const items = attachedBoards.filter(AttachedSerialBoard.is).map(board => ({
            label: `${board.name} at ${board.port}`,
            selected: configuredBoard === board,
            onClick: () => {
                this.props.boardsServiceClient.boardsConfig = {
                    selectedBoard: board,
                    selectedPort: availablePorts.find(port => Port.sameAs(port, board.port))
                }
            }
        }));

        return <React.Fragment>
            <div className='arduino-boards-toolbar-item-container'>
                <div className='arduino-boards-toolbar-item' title={title}>
                    <div className='inner-container' onClick={this.show}>
                        <span className={!configuredBoard ? 'fa fa-times notAttached' : ''}/>
                        <div className='label noWrapInfo'>
                            <div className='noWrapInfo noselect'>
                                {title}
                            </div>
                        </div>
                        <span className='fa fa-caret-down caret'/>
                    </div>
                </div>
            </div>
            <BoardsDropDown
                coords={coords}
                items={items}
                openBoardsConfig={this.openDialog}>
            </BoardsDropDown>
        </React.Fragment>;
    }

    protected openDialog = () => {
        this.props.commands.executeCommand(ArduinoCommands.OPEN_BOARDS_DIALOG.id);
        this.setState({ coords: 'hidden' });
    };

}
