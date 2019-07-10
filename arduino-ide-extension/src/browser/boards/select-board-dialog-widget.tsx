import * as React from 'react';
import { ReactWidget } from '@theia/core/lib/browser';
import { injectable, inject } from 'inversify';
import { BoardsService, Board, BoardPackage, AttachedSerialBoard } from '../../common/protocol/boards-service';
import { BoardsNotificationService } from '../boards-notification-service';
import { Emitter, Event } from '@theia/core';
import { BoardFrontendService } from './board-frontend-service';

export interface BoardAndPortSelection {
    board?: Board;
    port?: string;
}

export namespace BoardAndPortSelectableItem {
    export interface Props {
        item: BoardAndPortSelection,
        selected: boolean,
        onSelect: (selection: BoardAndPortSelection) => void
    }
}

export class BoardAndPortSelectableItem extends React.Component<BoardAndPortSelectableItem.Props> {

    render(): React.ReactNode {
        if (this.props.item.board || this.props.item.port) {
            return <div onClick={this.select} className={`item ${this.props.selected ? 'selected' : ''}`}>
                {this.props.item.board ? this.props.item.board.name : this.props.item.port}
                {this.props.selected ? <i className='fa fa-check'></i> : ''}
            </div>;
        }
    }

    protected readonly select = (() => {
        this.props.onSelect({ board: this.props.item.board, port: this.props.item.port })
    }).bind(this);
}

export namespace BoardAndPortSelectionList {
    export interface Props {
        type: 'boards' | 'ports';
        list: BoardAndPortSelection[];
        onSelect: (selection: BoardAndPortSelection) => void;
    }

    export interface State {
        selection: BoardAndPortSelection
    }
}

export class BoardAndPortSelectionList extends React.Component<BoardAndPortSelectionList.Props, BoardAndPortSelectionList.State> {

    constructor(props: BoardAndPortSelectionList.Props) {
        super(props);

        this.state = {
            selection: {}
        }
    }

    reset(): void {
        this.setState({ selection: {} });
    }

    render(): React.ReactNode {
        return <div className={`${this.props.type} list`}>
            {this.props.list.map(item => <BoardAndPortSelectableItem
                key={item.board ? item.board.name : item.port}
                onSelect={this.doSelect}
                item={item}
                selected={this.isSelectedItem(item)}
            />)}
        </div>
    }

    protected readonly doSelect = (boardAndPortSelection: BoardAndPortSelection) => {
        this.setState({ selection: boardAndPortSelection });
        this.props.onSelect(boardAndPortSelection);
    }

    protected readonly isSelectedItem = ((item: BoardAndPortSelection) => {
        if (this.state.selection.board) {
            return (this.state.selection.board === item.board);
        } else if (this.state.selection.port) {
            return (this.state.selection.port === item.port);
        }
        return false;
    });

    protected readonly isSelectedPort = ((port: string) => {
        return (this.state.selection.port && this.state.selection.port === port) || false;
    });
}

export namespace BoardAndPortSelectionComponent {
    export interface Props {
        boardsService: BoardsService;
        boardFrontendService: BoardFrontendService;
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
    protected boardListComponent: BoardAndPortSelectionList | null;
    protected portListComponent: BoardAndPortSelectionList | null;

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

    reset(): void {
        if (this.boardListComponent) {
            this.boardListComponent.reset();
        }
        if (this.portListComponent) {
            this.portListComponent.reset();
        }
        this.setState({ selection: {} });
    }

    render(): React.ReactNode {
        return <React.Fragment>
            <div className='body'>
                <div className='left container'>
                    <div className='content'>
                        <div className='title'>
                            BOARDS
                        </div>
                        <div className='search'>
                            <input type='search' placeholder='SEARCH BOARD' onChange={this.doFilter} />
                            <i className='fa fa-search'></i>
                        </div>
                        <BoardAndPortSelectionList
                            ref={ref => { this.boardListComponent = ref }}
                            type='boards'
                            onSelect={this.doSelect}
                            list={this.state.boards.map<BoardAndPortSelection>(board => ({ board }))} />
                    </div>
                </div>
                <div className='right container'>
                    <div className='content'>
                        <div className='title'>
                            PORTS
                    </div>
                        <BoardAndPortSelectionList
                            ref={ref => { this.portListComponent = ref }}
                            type='ports'
                            onSelect={this.doSelect}
                            list={this.state.ports.map<BoardAndPortSelection>(port => ({ port }))} />
                    </div>
                </div>
            </div>
        </React.Fragment>
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
        const boards = await this.props.boardFrontendService.getAttachedBoards();
        boards.forEach(board => {
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
    @inject(BoardFrontendService)
    protected readonly boardFrontendService: BoardFrontendService;
    @inject(BoardsNotificationService)
    protected readonly boardsNotificationService: BoardsNotificationService;

    protected readonly onChangedEmitter = new Emitter<BoardAndPortSelection>();
    protected boardAndPortSelectionComponent: BoardAndPortSelectionComponent | null;

    boardAndPort: BoardAndPortSelection = {};

    constructor() {
        super();
        this.id = 'select-board-dialog';

        this.toDispose.push(this.onChangedEmitter);
    }

    get onChanged(): Event<BoardAndPortSelection> {
        return this.onChangedEmitter.event;
    }

    reset(): void {
        if (this.boardAndPortSelectionComponent) {
            this.boardAndPortSelectionComponent.reset();
        }
        this.boardAndPort = {};
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
                        <p>Select both a BOARD and a PORT if you want to upload a sketch.</p>
                        <p>If you only select a BOARD you will be able just to compile,</p>
                        <p>but not to upload your sketch.</p>
                    </div>
                </div>
                <BoardAndPortSelectionComponent
                    ref={ref => this.boardAndPortSelectionComponent = ref}
                    boardFrontendService={this.boardFrontendService}
                    boardsService={boardsService}
                    onSelect={this.onSelect} />
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