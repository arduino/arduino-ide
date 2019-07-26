import * as React from 'react';
import { DisposableCollection } from '@theia/core';
import { BoardsService, Board, AttachedSerialBoard } from '../../common/protocol/boards-service';
import { BoardsServiceClientImpl } from './boards-service-client-impl';

export namespace BoardsConfig {

    export interface Config {
        selectedBoard?: Board;
        selectedPort?: string;
    }

    export interface Props {
        readonly boardsService: BoardsService;
        readonly boardsServiceClient: BoardsServiceClientImpl;
        readonly onConfigChange: (config: Config) => void;
        readonly onFocusNodeSet: (element: HTMLElement | undefined) => void;
    }

    export interface State extends Config {
        searchResults: Board[];
        knownPorts: string[];
    }

}

export abstract class Item<T> extends React.Component<{
    item: T,
    name: string,
    selected: boolean,
    onClick: (item: T) => void,
    missing?: boolean }> {

    render(): React.ReactNode {
        const { selected, name, missing } = this.props;
        const classNames = ['item'];
        if (selected) {
            classNames.push('selected');
        }
        if (missing === true) {
            classNames.push('missing')
        }
        return <div onClick={this.onClick} className={classNames.join(' ')}>
            {name}
            {selected ? <i className='fa fa-check'></i> : ''}
        </div>;
    }

    protected onClick = () => {
        this.props.onClick(this.props.item);
    }

}

export class BoardsConfig extends React.Component<BoardsConfig.Props, BoardsConfig.State> {

    protected toDispose = new DisposableCollection();

    constructor(props: BoardsConfig.Props) {
        super(props);

        const { boardsConfig } = props.boardsServiceClient;
        this.state = {
            searchResults: [],
            knownPorts: [],
            ...boardsConfig
        }
    }

    componentDidMount() {
        this.updateBoards();
        this.props.boardsService.getAttachedBoards().then(({ boards }) => this.updatePorts(boards));
        const { boardsServiceClient: client } = this.props;
        this.toDispose.pushAll([
            client.onBoardsChanged(event => this.updatePorts(event.newState.boards)),
            client.onBoardsConfigChanged(({ selectedBoard, selectedPort }) => {
                this.setState({ selectedBoard, selectedPort }, () => this.fireConfigChanged());
            })
        ]);
    }

    componentWillUnmount(): void {
        this.toDispose.dispose();
    }

    protected fireConfigChanged() {
        const { selectedBoard, selectedPort } = this.state;
        this.props.onConfigChange({ selectedBoard, selectedPort });
    }

    protected updateBoards = (eventOrQuery: React.ChangeEvent<HTMLInputElement> | string = '') => {
        const query = (typeof eventOrQuery === 'string'
            ? eventOrQuery
            : eventOrQuery.target.value.toLowerCase()
        ).trim();
        this.queryBoards({ query }).then(({ searchResults }) => this.setState({ searchResults }));
    }

    protected updatePorts = (boards: Board[] = []) => {
        this.queryPorts(Promise.resolve({ boards })).then(({ knownPorts }) => {
            let { selectedPort } = this.state;
            if (!!selectedPort && knownPorts.indexOf(selectedPort) === -1) {
                selectedPort = undefined;
            }
            this.setState({ knownPorts, selectedPort }, () => this.fireConfigChanged());
        });
    }

    protected queryBoards = (options: { query?: string } = {}): Promise<{ searchResults: Board[] }> => {
        const { boardsService } = this.props;
        const query = (options.query || '').toLocaleLowerCase();
        return new Promise<{ searchResults: Board[] }>(resolve => {
            boardsService.search(options)
                .then(({ items }) => items
                    .map(item => item.boards)
                    .reduce((acc, curr) => acc.concat(curr), [])
                    .filter(board => board.name.toLocaleLowerCase().indexOf(query) !== -1)
                    .sort(Board.compare))
                .then(searchResults => resolve({ searchResults }));
        });
    }

    protected get attachedBoards(): Promise<{ boards: Board[] }> {
        return this.props.boardsService.getAttachedBoards();
    }

    protected queryPorts = (attachedBoards: Promise<{ boards: Board[] }> = this.attachedBoards) => {
        return new Promise<{ knownPorts: string[] }>(resolve => {
            attachedBoards
                .then(({ boards }) => boards
                    .filter(AttachedSerialBoard.is)
                    .map(({ port }) => port)
                    .sort())
                .then(knownPorts => resolve({ knownPorts }));
        });
    }

    protected selectPort = (selectedPort: string | undefined) => {
        this.setState({ selectedPort }, () => this.fireConfigChanged());
    }

    protected selectBoard = (selectedBoard: Board | undefined) => {
        this.setState({ selectedBoard }, () => this.fireConfigChanged());
    }

    protected focusNodeSet = (element: HTMLElement | null) => {
        this.props.onFocusNodeSet(element || undefined);
    }

    render(): React.ReactNode {
        return <div className='body'>
            {this.renderContainer('boards', this.renderBoards.bind(this))}
            {this.renderContainer('ports', this.renderPorts.bind(this))}
        </div>;
    }

    protected renderContainer(title: string, contentRenderer: () => React.ReactNode): React.ReactNode {
        return <div className='container'>
            <div className='content'>
                <div className='title'>
                    {title}
                </div>
                {contentRenderer()}
            </div>
        </div>;
    }

    protected renderBoards(): React.ReactNode {
        const { selectedBoard } = this.state;
        return <React.Fragment>
            <div className='search'>
                <input type='search' placeholder='SEARCH BOARD' onChange={this.updateBoards} ref={this.focusNodeSet} />
                <i className='fa fa-search'></i>
            </div>
            <div className='boards list'>
                {this.state.searchResults.map((board, index) => <Item<Board>
                    key={`${board.name}-${index}`}
                    item={board}
                    name={board.name}
                    selected={!!selectedBoard && Board.equals(board, selectedBoard)}
                    onClick={this.selectBoard}
                    missing={!Board.installed(board)}
                />)}
            </div>
        </React.Fragment>;
    }

    protected renderPorts(): React.ReactNode {
        return !this.state.knownPorts.length ?
            (
                <div className='loading noselect'>
                    No ports discovered
                </div>
            ) :
            (
                <div className='ports list'>
                    {this.state.knownPorts.map(port => <Item<string>
                        key={port}
                        item={port}
                        name={port}
                        selected={this.state.selectedPort === port}
                        onClick={this.selectPort}
                    />)}
                </div>
            );
    }

}

export namespace BoardsConfig {

    export namespace Config {

        export function sameAs(config: Config, other: Config | AttachedSerialBoard): boolean {
            const { selectedBoard, selectedPort } = config;
            if (AttachedSerialBoard.is(other)) {
                return !!selectedBoard
                    && Board.equals(other, selectedBoard)
                    && selectedPort === other.port;
            }
            return sameAs(config, other);
        }

        export function equals(left: Config, right: Config): boolean {
            return left.selectedBoard === right.selectedBoard
                && left.selectedPort === right.selectedPort;
        }

        export function toString(config: Config, options: { default: string } = { default: '' }): string {
            const { selectedBoard, selectedPort: port } = config;
            if (!selectedBoard) {
                return options.default;
            }
            const { name } = selectedBoard;
            return `${name}${port ? ' at ' + port : ''}`;
        }

    }

}
