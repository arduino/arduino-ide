import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Event } from '@theia/core/lib/common/event';
import { FrontendApplicationState } from '@theia/core/lib/common/frontend-application-state';
import { nls } from '@theia/core/lib/common/nls';
import React from '@theia/core/shared/react';
import { EditBoardsConfigActionParams } from '../../common/protocol/board-list';
import {
  Board,
  BoardIdentifier,
  BoardWithPackage,
  DetectedPort,
  findMatchingPortIndex,
  Port,
  PortIdentifier,
} from '../../common/protocol/boards-service';
import { Defined } from '../../common/types';
import { NotificationCenter } from '../notification-center';
import { BoardsConfigDialogState } from './boards-config-dialog';

namespace BoardsConfigComponent {
  export interface Props {
    /**
     * This is not the real config, it's only living in the dialog. Users can change it without update and can cancel any modifications.
     */
    readonly boardsConfig: BoardsConfigDialogState;
    readonly searchSet: BoardIdentifier[] | undefined;
    readonly notificationCenter: NotificationCenter;
    readonly appState: FrontendApplicationState;
    readonly onFocusNodeSet: (element: HTMLElement | undefined) => void;
    readonly onFilteredTextDidChangeEvent: Event<
      Defined<EditBoardsConfigActionParams['query']>
    >;
    readonly onAppStateDidChange: Event<FrontendApplicationState>;
    readonly onBoardSelected: (board: BoardIdentifier) => void;
    readonly onPortSelected: (port: PortIdentifier) => void;
    readonly searchBoards: (query?: {
      query?: string;
    }) => Promise<BoardWithPackage[]>;
    readonly ports: (
      predicate?: (port: DetectedPort) => boolean
    ) => readonly DetectedPort[];
  }

  export interface State {
    searchResults: Array<BoardWithPackage>;
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

  private readonly onClick = () => {
    this.props.onClick(this.props.item);
  };
}

export class BoardsConfigComponent extends React.Component<
  BoardsConfigComponent.Props,
  BoardsConfigComponent.State
> {
  private readonly toDispose: DisposableCollection;

  constructor(props: BoardsConfigComponent.Props) {
    super(props);
    this.state = {
      searchResults: [],
      showAllPorts: false,
      query: '',
    };
    this.toDispose = new DisposableCollection();
  }

  override componentDidMount(): void {
    this.toDispose.pushAll([
      this.props.onAppStateDidChange(async (state) => {
        if (state === 'ready') {
          const searchResults = await this.queryBoards({});
          this.setState({ searchResults });
        }
      }),
      this.props.notificationCenter.onPlatformDidInstall(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onPlatformDidUninstall(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onIndexUpdateDidComplete(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onDaemonDidStart(() =>
        this.updateBoards(this.state.query)
      ),
      this.props.notificationCenter.onDaemonDidStop(() =>
        this.setState({ searchResults: [] })
      ),
      this.props.onFilteredTextDidChangeEvent((query) => {
        if (typeof query === 'string') {
          this.setState({ query }, () => this.updateBoards(this.state.query));
        }
      }),
    ]);
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private readonly updateBoards = (
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

  private readonly queryBoards = async (
    options: { query?: string } = {}
  ): Promise<Array<BoardWithPackage>> => {
    const result = await this.props.searchBoards(options);
    const { searchSet } = this.props;
    if (searchSet) {
      return result.filter((board) =>
        searchSet.some(
          (restriction) =>
            restriction.fqbn === board.fqbn || restriction.name === board.fqbn
        )
      );
    }
    return result;
  };

  private readonly toggleFilterPorts = () => {
    this.setState({ showAllPorts: !this.state.showAllPorts });
  };

  private readonly selectPort = (selectedPort: PortIdentifier) => {
    this.props.onPortSelected(selectedPort);
  };

  private readonly selectBoard = (selectedBoard: BoardWithPackage) => {
    this.props.onBoardSelected(selectedBoard);
  };

  private readonly focusNodeSet = (element: HTMLElement | null) => {
    this.props.onFocusNodeSet(element || undefined);
  };

  override render(): React.ReactNode {
    return (
      <>
        {this.renderContainer(
          nls.localize('arduino/board/boards', 'boards'),
          this.renderBoards.bind(this)
        )}
        {this.renderContainer(
          nls.localize('arduino/board/ports', 'ports'),
          this.renderPorts.bind(this),
          this.renderPortsFooter.bind(this)
        )}
      </>
    );
  }

  private renderContainer(
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

  private renderBoards(): React.ReactNode {
    const { boardsConfig } = this.props;
    const { searchResults, query } = this.state;
    // Board names are not unique per core https://github.com/arduino/arduino-pro-ide/issues/262#issuecomment-661019560
    // It is tricky when the core is not yet installed, no FQBNs are available.
    const distinctBoards = new Map<string, Board.Detailed>();
    const toKey = ({ name, packageName, fqbn }: Board.Detailed) =>
      !!fqbn ? `${name}-${packageName}-${fqbn}` : `${name}-${packageName}`;
    for (const board of Board.decorateBoards(
      boardsConfig.selectedBoard,
      searchResults
    )) {
      const key = toKey(board);
      if (!distinctBoards.has(key)) {
        distinctBoards.set(key, board);
      }
    }

    const boardsList = Array.from(distinctBoards.values()).map((board) => (
      <Item<BoardWithPackage>
        key={toKey(board)}
        item={board}
        label={board.name}
        details={board.details}
        selected={board.selected}
        onClick={this.selectBoard}
        missing={board.missing}
      />
    ));

    return (
      <React.Fragment>
        <div className="search">
          <input
            type="search"
            value={query}
            className="theia-input"
            placeholder={nls.localize(
              'arduino/board/searchBoard',
              'Search board'
            )}
            onChange={this.updateBoards}
            ref={this.focusNodeSet}
          />
          <i className="fa fa-search"></i>
        </div>
        {boardsList.length > 0 ? (
          <div className="boards list">{boardsList}</div>
        ) : (
          <div className="no-result">
            {nls.localize(
              'arduino/board/noBoardsFound',
              'No boards found for "{0}"',
              query
            )}
          </div>
        )}
      </React.Fragment>
    );
  }

  private renderPorts(): React.ReactNode {
    const predicate = this.state.showAllPorts ? undefined : Port.isVisiblePort;
    const detectedPorts = this.props.ports(predicate);
    const matchingIndex = findMatchingPortIndex(
      this.props.boardsConfig.selectedPort,
      detectedPorts
    );
    return !detectedPorts.length ? (
      <div className="no-result">
        {nls.localize('arduino/board/noPortsDiscovered', 'No ports discovered')}
      </div>
    ) : (
      <div className="ports list">
        {detectedPorts.map((detectedPort, index) => (
          <Item<Port>
            key={`${Port.keyOf(detectedPort.port)}`}
            item={detectedPort.port}
            label={Port.toString(detectedPort.port)}
            selected={index === matchingIndex}
            onClick={this.selectPort}
          />
        ))}
      </div>
    );
  }

  private renderPortsFooter(): React.ReactNode {
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
          <span>
            {nls.localize('arduino/board/showAllPorts', 'Show all ports')}
          </span>
        </label>
      </div>
    );
  }
}
