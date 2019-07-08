import * as React from 'react';
import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject } from 'inversify';
import { BoardsService, Board, BoardPackage, AttachedSerialBoard } from '../../common/protocol/boards-service';
import { BoardsNotificationService } from '../boards-notification-service';
import { Emitter, Event } from '@theia/core';

export interface BoardAndPortSelection {
    board?: Board;
    port?: string;
}

export namespace SelectableBoardsItem {
    export interface Props {
        board: Board,
        selected: boolean,
        onClick: (selection: BoardAndPortSelection) => void
    }
}

export class SelectableBoardsItem extends React.Component<SelectableBoardsItem.Props> {

    render(): React.ReactNode {
        return <div onClick={this.select} className={`item ${this.props.selected ? 'selected': ''}`}>{this.props.board.name}</div>
    }

    protected readonly select = (() => {
        this.props.onClick({ board: this.props.board })
    }).bind(this);
}

export namespace SelectablePortsItem {
    export interface Props {
        port: string,
        selected: boolean,
        onClick: (selection: BoardAndPortSelection) => void
    }
}

export class SelectablePortsItem extends React.Component<SelectablePortsItem.Props> {

    render(): React.ReactNode {
        return <div onClick={() => this.props.onClick({ port: this.props.port })} className={`item ${this.props.selected ? 'selected': ''}`}>{this.props.port}</div>
    }

    protected readonly select = (() => {
        this.props.onClick({ port: this.props.port })
    }).bind(this);
}

export namespace BoardAndPortSelectionComponent {
    export interface Props {
        boardsService: BoardsService;
        onSelect: (selection: BoardAndPortSelection) => void;
    }

    export interface State {
        boards: Board[];
        ports: string[];
        selection: BoardAndPortSelection;
    }
}

export class BoardAndPortSelectionComponent extends React.Component<BoardAndPortSelectionComponent.Props, BoardAndPortSelectionComponent.State> {

    protected allBoards: Board[] = [];

    constructor(props: BoardAndPortSelectionComponent.Props) {
        super(props);

        this.state = {
            boards: [],
            ports: [],
            selection: {}
        }
    }

    componentDidMount() {
        this.searchAvailableBoards();
        this.setPorts();
    }

    render(): React.ReactNode {
        return <React.Fragment>
            <div className='body'>
                <div className='left'>
                    <div className='title'>
                        BOARDS
                    </div>
                    <div className='search'>
                        <input type='search' placeholder='SEARCH BOARD' onChange={this.doFilter} />
                    </div>
                    <div className='boards list'>
                        {this.state.boards.map(board => <SelectableBoardsItem key={board.name} onClick={this.doSelect} board={board} selected={this.isSelectedBoard(board)}/>)}
                    </div>
                </div>
                <div className='right'>
                    <div className='title'>
                        PORTS
                    </div>
                    <div className='ports list'>
                        {this.state.ports.map(port => <SelectablePortsItem key={port} onClick={this.doSelect} port={port} selected={this.isSelectedPort(port)}/>)}
                    </div>
                </div>
            </div>
        </React.Fragment>
    }

    protected readonly isSelectedBoard = ((board: Board) => {
        return (this.state.selection.board && this.state.selection.board === board) || false;       
    });

    protected readonly isSelectedPort = ((port: string) => {
        return (this.state.selection.port && this.state.selection.port === port) || false;       
    });

    protected readonly doSelect = (boardAndPortSelection: BoardAndPortSelection) => {
        const selection = this.state.selection;
        if (boardAndPortSelection.board) {
            selection.board = boardAndPortSelection.board;
        }
        if (boardAndPortSelection.port) {
            selection.port = boardAndPortSelection.port;
        }
        this.setState({ selection });
        this.props.onSelect(this.state.selection);
    }

    protected sort(items: Board[]): Board[] {
        return items.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            } else if (a.name === b.name) {
                return 0;
            } else {
                return 1;
            }
        });
    }

    protected readonly doFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
        const boards = this.allBoards.filter(board => board.name.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0);
        this.setState({ boards })
    }

    protected async searchAvailableBoards() {
        const boardPkg = await this.props.boardsService.search({});
        const boards = [].concat.apply([], boardPkg.items.map<Board[]>(item => item.boards)) as Board[];
        this.allBoards = this.sort(boards);
        this.setState({ boards: this.allBoards });
    }

    protected async setPorts() {
        const ports: string[] = [];
        const attached = await this.props.boardsService.getAttachedBoards();
        attached.boards.forEach(board => {
            if (AttachedSerialBoard.is(board)) {
                ports.push(board.port);
            }
        });
        this.setState({ ports });
    }
}

@injectable()
export class SelectBoardDialogWidget extends ReactWidget {

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;
    @inject(BoardsNotificationService)
    protected readonly boardsNotificationService: BoardsNotificationService;

    protected readonly onChangedEmitter = new Emitter<BoardAndPortSelection>();

    boardAndPort: BoardAndPortSelection = {};

    constructor() {
        super();
        this.id = 'select-board-dialog';

        this.toDispose.push(this.onChangedEmitter);
    }

    get onChanged(): Event<BoardAndPortSelection> {
        return this.onChangedEmitter.event;
    }

    protected fireChanged(boardAndPort: BoardAndPortSelection): void {
        this.onChangedEmitter.fire(boardAndPort);
    }

    protected render(): React.ReactNode {
        let content: React.ReactNode;

        const boardsServiceDelegate = this.boardsService;
        const boardsService: BoardsService = {
            getAttachedBoards: () => boardsServiceDelegate.getAttachedBoards(),
            selectBoard: (board: Board) => boardsServiceDelegate.selectBoard(board),
            getSelectBoard: () => boardsServiceDelegate.getSelectBoard(),
            search: (options: { query?: string }) => boardsServiceDelegate.search(options),
            install: async (item: BoardPackage) => {
                await boardsServiceDelegate.install(item);
                this.boardsNotificationService.notifyBoardsInstalled();
            }
        }

        content = <React.Fragment>
            <div className='selectBoardContainer'>
                <div className='head'>
                    <div className='title'>
                        Select Other Board &amp; Port
                    </div>
                    <div className='text'>
                        Select both a BOARD and a PORT if you want to upload a sketch.<br />
                        If you only select a BOARD you will be able just to compile, but not to upload your sketch.
                    </div>
                </div>
                <BoardAndPortSelectionComponent boardsService={boardsService} onSelect={this.onSelect} />
            </div>
        </React.Fragment>

        return content;
    }

    protected readonly onSelect = (selection: BoardAndPortSelection) => { this.doOnSelect(selection) };
    protected doOnSelect(selection: BoardAndPortSelection) {
        this.boardAndPort = selection;
        this.fireChanged(this.boardAndPort);
    }
}