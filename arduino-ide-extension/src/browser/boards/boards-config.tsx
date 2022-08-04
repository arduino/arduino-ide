import * as React from '@theia/core/shared/react';
import { Event } from '@theia/core/lib/common/event';
import { notEmpty } from '@theia/core/lib/common/objects';
import { MaybePromise } from '@theia/core/lib/common/types';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  Board,
  Port,
  AttachedBoardsChangeEvent,
  BoardWithPackage,
} from '../../common/protocol/boards-service';
import { NotificationCenter } from '../notification-center';
import {
  AvailableBoard,
  BoardsServiceProvider,
} from './boards-service-provider';
import { naturalCompare } from '../../common/utils';
import { nls } from '@theia/core/lib/common';
import { FrontendApplicationState } from '@theia/core/lib/common/frontend-application-state';

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
    readonly onFilteredTextDidChangeEvent: Event<string>;
    readonly onAppStateDidChange: Event<FrontendApplicationState>;
  }

  export interface State extends Config {
    searchResults: Array<BoardWithPackage>;
    knownPorts: Port[];
    showAllPorts: boolean;
    query: string;
  }
}

export abstract class Item<T> extends React.Component<{
  item: T;
  label: string;
  selected: boolean;
  onClick: (item: T) => void;
  missing?: boolean;
  details?: string;
}> {
  override render(): React.ReactNode {
    const { selected, label, missing, details } = this.props;
    const classNames = ['item'];
    if (selected) {
      classNames.push('selected');
    }
    if (missing === true) {
      classNames.push('missing');
    }
    return (
      <div
        onClick={this.onClick}
        className={classNames.join(' ')}
        title={`${label}${!details ? '' : details}`}
      >
        <div className="label">{label}</div>
        {!details ? '' : <div className="details">{details}</div>}
        {!selected ? (
          ''
        ) : (
          <div className="selected-icon">
            <i className="fa fa-check" />
          </div>
        )}
      </div>
    );
  }

  protected onClick = () => {
    this.props.onClick(this.props.item);
  };
}

export class BoardsConfig extends React.Component<
  BoardsConfig.Props,
  BoardsConfig.State
> {
  protected toDispose = new DisposableCollection();

  constructor(props: BoardsConfig.Props) {
    super(props);

    const { boardsConfig } = props.boardsServiceProvider;
    this.state = {
      searchResults: [],
      knownPorts: [],
      showAllPorts: false,
      query: '',
      ...boardsConfig,
    };
  }

  override componentDidMount(): void {
    this.toDispose.pushAll([
      this.props.onAppStateDidChange((state) => {
        if (state === 'ready') {
          this.updateBoards();
          this.updatePorts(
            this.props.boardsServiceProvider.availableBoards
              .map(({ port }) => port)
              .filter(notEmpty)
          );
        }
      }),
      this.props.notificationCenter.onAttachedBoardsDidChange((event) =>
        this.updatePorts(
          event.newState.ports,
          AttachedBoardsChangeEvent.diff(event).detached.ports
        )
      ),
      this.props.boardsServiceProvider.onBoardsConfigChanged(
        ({ selectedBoard, selectedPort }) => {
          this.setState({ selectedBoard, selectedPort }, () =>
            this.fireConfigChanged()
          );
        }
      ),
      this.props.notificationCenter.onPlatformDidInstall(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onPlatformDidUninstall(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onIndexDidUpdate(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onDaemonDidStart(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onDaemonDidStop(() =>
        this.setState({ searchResults: [] })
      ),
      this.props.onFilteredTextDidChangeEvent((query) =>
        this.setState({ query }, () => this.updateBoards(this.state.query))
      ),
    ]);
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  protected fireConfigChanged(): void {
    const { selectedBoard, selectedPort } = this.state;
    this.props.onConfigChange({ selectedBoard, selectedPort });
  }

  protected updateBoards = (
    eventOrQuery: React.ChangeEvent<HTMLInputElement> | string = ''
  ) => {
    const query =
      typeof eventOrQuery === 'string'
        ? eventOrQuery
        : eventOrQuery.target.value.toLowerCase();
    this.setState({ query });
    this.queryBoards({ query }).then((searchResults) =>
      this.setState({ searchResults })
    );
  };

  protected updatePorts = (ports: Port[] = [], removedPorts: Port[] = []) => {
    this.queryPorts(Promise.resolve(ports)).then(({ knownPorts }) => {
      let { selectedPort } = this.state;
      // If the currently selected port is not available anymore, unset the selected port.
      if (removedPorts.some((port) => Port.sameAs(port, selectedPort))) {
        selectedPort = undefined;
      }
      this.setState({ knownPorts, selectedPort }, () =>
        this.fireConfigChanged()
      );
    });
  };

  protected queryBoards = (
    options: { query?: string } = {}
  ): Promise<Array<BoardWithPackage>> => {
    return this.props.boardsServiceProvider.searchBoards(options);
  };

  protected get availablePorts(): MaybePromise<Port[]> {
    return this.props.boardsServiceProvider.availableBoards
      .map(({ port }) => port)
      .filter(notEmpty);
  }

  protected get availableBoards(): AvailableBoard[] {
    return this.props.boardsServiceProvider.availableBoards;
  }

  protected queryPorts = async (
    availablePorts: MaybePromise<Port[]> = this.availablePorts
  ) => {
    // Available ports must be sorted in this order:
    // 1. Serial with recognized boards
    // 2. Serial with guessed boards
    // 3. Serial with incomplete boards
    // 4. Network with recognized boards
    // 5. Other protocols with recognized boards
    const ports = (await availablePorts).sort((left: Port, right: Port) => {
      if (left.protocol === 'serial' && right.protocol !== 'serial') {
        return -1;
      } else if (left.protocol !== 'serial' && right.protocol === 'serial') {
        return 1;
      } else if (left.protocol === 'network' && right.protocol !== 'network') {
        return -1;
      } else if (left.protocol !== 'network' && right.protocol === 'network') {
        return 1;
      } else if (left.protocol === right.protocol) {
        // We show ports, including those that have guessed
        // or unrecognized boards, so we must sort those too.
        const leftBoard = this.availableBoards.find(
          (board) => board.port === left
        );
        const rightBoard = this.availableBoards.find(
          (board) => board.port === right
        );
        if (leftBoard && !rightBoard) {
          return -1;
        } else if (!leftBoard && rightBoard) {
          return 1;
        } else if (leftBoard?.state! < rightBoard?.state!) {
          return -1;
        } else if (leftBoard?.state! > rightBoard?.state!) {
          return 1;
        }
      }
      return naturalCompare(left.address, right.address);
    });
    return { knownPorts: ports };
  };

  protected toggleFilterPorts = () => {
    this.setState({ showAllPorts: !this.state.showAllPorts });
  };

  protected selectPort = (selectedPort: Port | undefined) => {
    this.setState({ selectedPort }, () => this.fireConfigChanged());
  };

  protected selectBoard = (selectedBoard: BoardWithPackage | undefined) => {
    this.setState({ selectedBoard }, () => this.fireConfigChanged());
  };

  protected focusNodeSet = (element: HTMLElement | null) => {
    this.props.onFocusNodeSet(element || undefined);
  };

  override render(): React.ReactNode {
    return (
      <>
        {this.renderContainer('boards', this.renderBoards.bind(this))}
        {this.renderContainer(
          'ports',
          this.renderPorts.bind(this),
          this.renderPortsFooter.bind(this)
        )}
      </>
    );
  }

  protected renderContainer(
    title: string,
    contentRenderer: () => React.ReactNode,
    footerRenderer?: () => React.ReactNode
  ): React.ReactNode {
    return (
      <div className="container">
        <div className="content">
          <div className="title">{title}</div>
          {contentRenderer()}
          <div className="footer">{footerRenderer ? footerRenderer() : ''}</div>
        </div>
      </div>
    );
  }

  protected renderBoards(): React.ReactNode {
    const { selectedBoard, searchResults, query } = this.state;
    // Board names are not unique per core https://github.com/arduino/arduino-pro-ide/issues/262#issuecomment-661019560
    // It is tricky when the core is not yet installed, no FQBNs are available.
    const distinctBoards = new Map<string, Board.Detailed>();
    const toKey = ({ name, packageName, fqbn }: Board.Detailed) =>
      !!fqbn ? `${name}-${packageName}-${fqbn}` : `${name}-${packageName}`;
    for (const board of Board.decorateBoards(selectedBoard, searchResults)) {
      const key = toKey(board);
      if (!distinctBoards.has(key)) {
        distinctBoards.set(key, board);
      }
    }

    return (
      <React.Fragment>
        <div className="search">
          <input
            type="search"
            value={query}
            className="theia-input"
            placeholder="SEARCH BOARD"
            onChange={this.updateBoards}
            ref={this.focusNodeSet}
          />
          <i className="fa fa-search"></i>
        </div>
        <div className="boards list">
          {Array.from(distinctBoards.values()).map((board) => (
            <Item<BoardWithPackage>
              key={toKey(board)}
              item={board}
              label={board.name}
              details={board.details}
              selected={board.selected}
              onClick={this.selectBoard}
              missing={board.missing}
            />
          ))}
        </div>
      </React.Fragment>
    );
  }

  protected renderPorts(): React.ReactNode {
    let ports = [] as Port[];
    if (this.state.showAllPorts) {
      ports = this.state.knownPorts;
    } else {
      ports = this.state.knownPorts.filter((port) => {
        if (port.protocol === 'serial') {
          return true;
        }
        // All other ports with different protocol are
        // only shown if there is a recognized board
        // connected
        for (const board of this.availableBoards) {
          if (board.port?.address === port.address) {
            return true;
          }
        }
      });
    }
    return !ports.length ? (
      <div className="loading noselect">No ports discovered</div>
    ) : (
      <div className="ports list">
        {ports.map((port) => (
          <Item<Port>
            key={`${port.id}`}
            item={port}
            label={Port.toString(port)}
            selected={Port.sameAs(this.state.selectedPort, port)}
            onClick={this.selectPort}
          />
        ))}
      </div>
    );
  }

  protected renderPortsFooter(): React.ReactNode {
    return (
      <div className="noselect">
        <label
          title={nls.localize(
            'arduino/board/showAllAvailablePorts',
            'Shows all available ports when enabled'
          )}
        >
          <input
            type="checkbox"
            defaultChecked={this.state.showAllPorts}
            onChange={this.toggleFilterPorts}
          />
          <span>Show all ports</span>
        </label>
      </div>
    );
  }
}

export namespace BoardsConfig {
  export namespace Config {
    export function sameAs(config: Config, other: Config | Board): boolean {
      const { selectedBoard, selectedPort } = config;
      if (Board.is(other)) {
        return (
          !!selectedBoard &&
          Board.equals(other, selectedBoard) &&
          Port.sameAs(selectedPort, other.port)
        );
      }
      return sameAs(config, other);
    }

    export function equals(left: Config, right: Config): boolean {
      return (
        left.selectedBoard === right.selectedBoard &&
        left.selectedPort === right.selectedPort
      );
    }

    export function toString(
      config: Config,
      options: { default: string } = { default: '' }
    ): string {
      const { selectedBoard, selectedPort: port } = config;
      if (!selectedBoard) {
        return options.default;
      }
      const { name } = selectedBoard;
      return `${name}${port ? ` at ${port.address}` : ''}`;
    }

    export function setConfig(
      config: Config | undefined,
      urlToAttachTo: URL
    ): URL {
      const copy = new URL(urlToAttachTo.toString());
      if (!config) {
        copy.searchParams.delete('boards-config');
        return copy;
      }

      const selectedBoard = config.selectedBoard
        ? {
            name: config.selectedBoard.name,
            fqbn: config.selectedBoard.fqbn,
          }
        : undefined;
      const selectedPort = config.selectedPort
        ? {
            protocol: config.selectedPort.protocol,
            address: config.selectedPort.address,
          }
        : undefined;
      const jsonConfig = JSON.stringify({ selectedBoard, selectedPort });
      copy.searchParams.set('boards-config', encodeURIComponent(jsonConfig));
      return copy;
    }

    export function getConfig(url: URL): Config | undefined {
      const encoded = url.searchParams.get('boards-config');
      if (!encoded) {
        return undefined;
      }
      try {
        const raw = decodeURIComponent(encoded);
        const candidate = JSON.parse(raw);
        if (typeof candidate === 'object') {
          return candidate;
        }
        console.warn(
          `Expected candidate to be an object. It was ${typeof candidate}. URL was: ${url}`
        );
        return undefined;
      } catch (e) {
        console.log(`Could not get board config from URL: ${url}.`, e);
        return undefined;
      }
    }
  }
}
