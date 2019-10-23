import * as React from 'react';
import { DisposableCollection } from '@theia/core';
import { BoardsService, Board, Port, AttachedSerialBoard, AttachedBoardsChangeEvent } from '../../common/protocol/boards-service';
import { BoardsServiceClientImpl } from './boards-service-client-impl';

export namespace BoardsConfig {

    export interface Config {
        selectedBoard?: Board;
        selectedPort?: Port;
    }

    export interface Props {
        readonly boardsService: BoardsService;
        readonly boardsServiceClient: BoardsServiceClientImpl;
        readonly onConfigChange: (config: Config) => void;
        readonly onFocusNodeSet: (element: HTMLElement | undefined) => void;
    }

    export interface State extends Config {
        searchResults: Array<Board & { packageName: string }>;
        knownPorts: Port[];
        showAllPorts: boolean;
    }

}

export abstract class Item<T> extends React.Component<{
    item: T,
    label: string,
    selected: boolean,
    onClick: (item: T) => void,
    missing?: boolean,
    detail?: string
}> {

    render(): React.ReactNode {
        const { selected, label, missing, detail } = this.props;
        const classNames = ['item'];
        if (selected) {
            classNames.push('selected');
        }
        if (missing === true) {
            classNames.push('missing')
        }
        return <div onClick={this.onClick} className={classNames.join(' ')} title={`${label}${!detail ? '' : detail}`}>
            <div className='label'>
                {label}
            </div>
            {!detail ? '' : <div className='detail'>{detail}</div>}
            {!selected ? '' : <div className='selected-icon'><i className='fa fa-check' /></div>}
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
            showAllPorts: false,
            ...boardsConfig
        }
    }

    componentDidMount() {
        this.updateBoards();
        this.props.boardsService.getAvailablePorts().then(({ ports }) => this.updatePorts(ports));
        const { boardsServiceClient: client } = this.props;
        this.toDispose.pushAll([
            client.onBoardsChanged(event => this.updatePorts(event.newState.ports, AttachedBoardsChangeEvent.diff(event).detached.ports)),
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

    protected updatePorts = (ports: Port[] = [], removedPorts: Port[] = []) => {
        this.queryPorts(Promise.resolve({ ports })).then(({ knownPorts }) => {
            let { selectedPort } = this.state;
            // If the currently selected port is not available anymore, unset the selected port.
            if (removedPorts.some(port => Port.equals(port, selectedPort))) {
                selectedPort = undefined;
            }
            this.setState({ knownPorts, selectedPort }, () => this.fireConfigChanged());
        });
    }

    protected queryBoards = (options: { query?: string } = {}): Promise<{ searchResults: Array<Board & { packageName: string }> }> => {
        const { boardsService } = this.props;
        const query = (options.query || '').toLocaleLowerCase();
        return new Promise<{ searchResults: Array<Board & { packageName: string }> }>(resolve => {
            boardsService.search(options)
                .then(({ items }) => items
                    .map(item => item.boards.map(board => ({ ...board, packageName: item.name })))
                    .reduce((acc, curr) => acc.concat(curr), [])
                    .filter(board => board.name.toLocaleLowerCase().indexOf(query) !== -1)
                    .sort(Board.compare))
                .then(searchResults => resolve({ searchResults }));
        });
    }

    protected get attachedBoards(): Promise<{ boards: Board[] }> {
        return this.props.boardsService.getAttachedBoards();
    }

    protected get availablePorts(): Promise<{ ports: Port[] }> {
        return this.props.boardsService.getAvailablePorts();
    }

    protected queryPorts = (availablePorts: Promise<{ ports: Port[] }> = this.availablePorts) => {
        return new Promise<{ knownPorts: Port[] }>(resolve => {
            availablePorts
                .then(({ ports }) => ports
                    .sort(Port.compare))
                .then(knownPorts => resolve({ knownPorts }));
        });
    }

    protected toggleFilterPorts = () => {
        this.setState({ showAllPorts: !this.state.showAllPorts });
    }

    protected selectPort = (selectedPort: Port | undefined) => {
        this.setState({ selectedPort }, () => this.fireConfigChanged());
    }

    protected selectBoard = (selectedBoard: Board & { packageName: string } | undefined) => {
        this.setState({ selectedBoard }, () => this.fireConfigChanged());
    }

    protected focusNodeSet = (element: HTMLElement | null) => {
        this.props.onFocusNodeSet(element || undefined);
    }

    render(): React.ReactNode {
        return <div className='body'>
            {this.renderContainer('boards', this.renderBoards.bind(this))}
            {this.renderContainer('ports', this.renderPorts.bind(this), this.renderPortsFooter.bind(this))}
        </div>;
    }

    protected renderContainer(title: string, contentRenderer: () => React.ReactNode, footerRenderer?: () => React.ReactNode): React.ReactNode {
        return <div className='container'>
            <div className='content'>
                <div className='title'>
                    {title}
                </div>
                {contentRenderer()}
                <div className='footer'>
                    {(footerRenderer ? footerRenderer() : '')}
                </div>
            </div>
        </div>;
    }

    protected renderBoards(): React.ReactNode {
        const { selectedBoard, searchResults } = this.state;
        // Board names are not unique. We show the corresponding core name as a detail.
        // https://github.com/arduino/arduino-cli/pull/294#issuecomment-513764948
        const distinctBoardNames = new Map<string, number>();
        for (const { name } of searchResults) {
            const counter = distinctBoardNames.get(name) || 0;
            distinctBoardNames.set(name, counter + 1);
        }

        // Due to the non-unique board names, we have to check the package name as well.
        const selected = (board: Board & { packageName: string }) => {
            if (!!selectedBoard) {
                if (Board.equals(board, selectedBoard)) {
                    if ('packageName' in selectedBoard) {
                        return board.packageName === (selectedBoard as any).packageName;
                    }
                    return true;
                }
            }
            return false;
        }

        return <React.Fragment>
            <div className='search'>
                <input type='search' placeholder='SEARCH BOARD' onChange={this.updateBoards} ref={this.focusNodeSet} />
                <i className='fa fa-search'></i>
            </div>
            <div className='boards list'>
                {this.state.searchResults.map(board => <Item<Board & { packageName: string }>
                    key={`${board.name}-${board.packageName}`}
                    item={board}
                    label={board.name}
                    detail={(distinctBoardNames.get(board.name) || 0) > 1 ? ` - ${board.packageName}` : undefined}
                    selected={selected(board)}
                    onClick={this.selectBoard}
                    missing={!Board.installed(board)}
                />)}
            </div>
        </React.Fragment>;
    }

    protected renderPorts(): React.ReactNode {
        const filter = this.state.showAllPorts ? () => true : Port.isBoardPort;
        const ports = this.state.knownPorts.filter(filter);
        return !ports.length ?
            (
                <div className='loading noselect'>
                    No ports discovered
                </div>
            ) :
            (
                <div className='ports list'>
                    {ports.map(port => <Item<Port>
                        key={Port.toString(port)}
                        item={port}
                        label={Port.toString(port)}
                        selected={Port.equals(this.state.selectedPort, port)}
                        onClick={this.selectPort}
                    />)}
                </div>
            );
    }

    protected renderPortsFooter(): React.ReactNode {
        return <div className='noselect'>
            <label
                title='Shows all available ports when enabled'>
                <input
                    type='checkbox'
                    defaultChecked={this.state.showAllPorts}
                    onChange={this.toggleFilterPorts}
                />
                <span>Show all ports</span>
            </label>
        </div>;
    }

}

export namespace BoardsConfig {

    export namespace Config {

        export function sameAs(config: Config, other: Config | AttachedSerialBoard): boolean {
            const { selectedBoard, selectedPort } = config;
            if (AttachedSerialBoard.is(other)) {
                return !!selectedBoard
                    && Board.equals(other, selectedBoard)
                    && Port.sameAs(selectedPort, other.port);
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
            return `${name}${port ? ' at ' + Port.toString(port) : ''}`;
        }

    }

}
