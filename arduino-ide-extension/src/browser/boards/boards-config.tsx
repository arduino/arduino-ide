import * as React from 'react';
import { notEmpty } from '@theia/core/lib/common/objects';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Board, Port, AttachedBoardsChangeEvent } from '../../common/protocol/boards-service';
import { BoardsServiceProvider } from './boards-service-provider';
import { NotificationCenter } from '../notification-center';
import { MaybePromise } from '@theia/core';

export namespace BoardsConfig {

    export interface Config {
        selectedBoard?: Board;
        selectedPort?: Port;
    }

    export interface Props {
        readonly boardsServiceProvider: BoardsServiceProvider;
        readonly notificationCenter: NotificationCenter;
        readonly onConfigChange: (config: Config) => void;
        readonly onFocusNodeSet: (element: HTMLElement | undefined) => void;
    }

    export interface State extends Config {
        searchResults: Array<Board & { packageName: string }>;
        knownPorts: Port[];
        showAllPorts: boolean;
        query: string;
    }

}

export abstract class Item<T> extends React.Component<{
    item: T,
    label: string,
    selected: boolean,
    onClick: (item: T) => void,
    missing?: boolean,
    details?: string
}> {

    render(): React.ReactNode {
        const { selected, label, missing, details } = this.props;
        const classNames = ['item'];
        if (selected) {
            classNames.push('selected');
        }
        if (missing === true) {
            classNames.push('missing')
        }
        return <div onClick={this.onClick} className={classNames.join(' ')} title={`${label}${!details ? '' : details}`}>
            <div className='label'>
                {label}
            </div>
            {!details ? '' : <div className='details'>{details}</div>}
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

        const { boardsConfig } = props.boardsServiceProvider;
        this.state = {
            searchResults: [],
            knownPorts: [],
            showAllPorts: false,
            query: '',
            ...boardsConfig
        }
    }

    componentDidMount() {
        this.updateBoards();
        this.updatePorts(this.props.boardsServiceProvider.availableBoards.map(({ port }) => port).filter(notEmpty));
        this.toDispose.pushAll([
            this.props.notificationCenter.onAttachedBoardsChanged(event => this.updatePorts(event.newState.ports, AttachedBoardsChangeEvent.diff(event).detached.ports)),
            this.props.boardsServiceProvider.onBoardsConfigChanged(({ selectedBoard, selectedPort }) => {
                this.setState({ selectedBoard, selectedPort }, () => this.fireConfigChanged());
            }),
            this.props.notificationCenter.onPlatformInstalled(() => this.updateBoards(this.state.query)),
            this.props.notificationCenter.onPlatformUninstalled(() => this.updateBoards(this.state.query)),
            this.props.notificationCenter.onIndexUpdated(() => this.updateBoards(this.state.query)),
            this.props.notificationCenter.onDaemonStarted(() => this.updateBoards(this.state.query)),
            this.props.notificationCenter.onDaemonStopped(() => this.setState({ searchResults: [] }))
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
        this.setState({ query });
        this.queryBoards({ query }).then(searchResults => this.setState({ searchResults }));
    }

    protected updatePorts = (ports: Port[] = [], removedPorts: Port[] = []) => {
        this.queryPorts(Promise.resolve(ports)).then(({ knownPorts }) => {
            let { selectedPort } = this.state;
            // If the currently selected port is not available anymore, unset the selected port.
            if (removedPorts.some(port => Port.equals(port, selectedPort))) {
                selectedPort = undefined;
            }
            this.setState({ knownPorts, selectedPort }, () => this.fireConfigChanged());
        });
    }

    protected queryBoards = (options: { query?: string } = {}): Promise<Array<Board & { packageName: string }>> => {
        return this.props.boardsServiceProvider.searchBoards(options);
    }

    protected get availablePorts(): MaybePromise<Port[]> {
        return this.props.boardsServiceProvider.availableBoards.map(({ port }) => port).filter(notEmpty);
    }

    protected queryPorts = async (availablePorts: MaybePromise<Port[]> = this.availablePorts) => {
        const ports = await availablePorts;
        return { knownPorts: ports.sort(Port.compare) };
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
        // Board names are not unique per core https://github.com/arduino/arduino-pro-ide/issues/262#issuecomment-661019560
        // It is tricky when the core is not yet installed, no FQBNs are available.
        const distinctBoards = new Map<string, Board.Detailed>();
        const toKey = ({ name, packageName, fqbn }: Board.Detailed) => !!fqbn ? `${name}-${packageName}-${fqbn}` : `${name}-${packageName}`;
        for (const board of Board.decorateBoards(selectedBoard, searchResults)) {
            const key = toKey(board);
            if (!distinctBoards.has(key)) {
                distinctBoards.set(key, board);
            }
        }

        return <React.Fragment>
            <div className='search'>
                <input type='search' className='theia-input' placeholder='SEARCH BOARD' onChange={this.updateBoards} ref={this.focusNodeSet} />
                <i className='fa fa-search'></i>
            </div>
            <div className='boards list'>
                {Array.from(distinctBoards.values()).map(board => <Item<Board & { packageName: string }>
                    key={`${board.name}-${board.packageName}`}
                    item={board}
                    label={board.name}
                    details={board.details}
                    selected={board.selected}
                    onClick={this.selectBoard}
                    missing={board.missing}
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

        export function sameAs(config: Config, other: Config | Board): boolean {
            const { selectedBoard, selectedPort } = config;
            if (Board.is(other)) {
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
