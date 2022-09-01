import { TabBarToolbar } from '@theia/core/lib/browser/shell/tab-bar-toolbar/tab-bar-toolbar';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import type { CommandRegistry } from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import React from '@theia/core/shared/react';
import ReactDOM from '@theia/core/shared/react-dom';
import classNames from 'classnames';
import { unknownBoard } from '../../common/protocol';
import {
  BoardListItem,
  getInferredBoardOrBoard,
  InferredBoardListItem,
  isInferredBoardListItem,
} from '../../common/protocol/board-list';
import {
  BoardListUI,
  BoardsServiceProvider,
  EditBoardsConfigAction,
  SelectBoardsConfigAction,
} from './boards-service-provider';

export interface BoardsDropDownListCoords {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly paddingTop: number;
}

export namespace BoardsDropDown {
  export interface Props {
    readonly coords: BoardsDropDownListCoords | 'hidden';
    readonly boardList: BoardListUI;
    readonly openBoardsConfig: () => void;
  }
}

export class BoardListDropDown extends React.Component<BoardsDropDown.Props> {
  private dropdownElement: HTMLElement;
  private listRef: React.RefObject<HTMLDivElement>;

  constructor(props: BoardsDropDown.Props) {
    super(props);
    this.listRef = React.createRef();
    let list = document.getElementById('boards-dropdown-container');
    if (!list) {
      list = document.createElement('div');
      list.id = 'boards-dropdown-container';
      document.body.appendChild(list);
      this.dropdownElement = list;
    }
  }

  override componentDidUpdate(prevProps: BoardsDropDown.Props): void {
    if (prevProps.coords === 'hidden' && this.listRef.current) {
      this.listRef.current.focus();
    }
  }

  override render(): React.ReactNode {
    return ReactDOM.createPortal(
      this.renderBoardListItems(),
      this.dropdownElement
    );
  }

  private renderBoardListItems(): React.ReactNode {
    const { coords, boardList } = this.props;
    if (coords === 'hidden') {
      return '';
    }
    const footerLabel = nls.localize(
      'arduino/board/openBoardsConfig',
      'Select other board and port…'
    );
    return (
      <div
        className="arduino-boards-dropdown-list"
        style={{
          position: 'absolute',
          ...coords,
        }}
        ref={this.listRef}
        tabIndex={0}
      >
        <div className="arduino-boards-dropdown-list--items-container">
          {boardList.map((item, index) =>
            this.renderBoardListItem({
              item,
              selected: index === boardList.selectedIndex,
              onSelect: boardList.onSelect,
              onEdit: boardList.onEdit,
            })
          )}
        </div>
        <div
          key={footerLabel}
          tabIndex={0}
          className="arduino-boards-dropdown-item arduino-board-dropdown-footer"
          onClick={() => this.props.openBoardsConfig()}
        >
          <div>{footerLabel}</div>
        </div>
      </div>
    );
  }

  private renderBoardListItem({
    item,
    selected,
    onSelect,
    onEdit,
  }: {
    item: BoardListItem;
    selected: boolean;
    onSelect: SelectBoardsConfigAction;
    onEdit: EditBoardsConfigAction;
  }): React.ReactNode {
    const port = item.port;
    const board = getInferredBoardOrBoard(item);
    const boardLabel = board?.name ?? unknownBoard;
    const boardFqbn = board?.fqbn;
    const onDefaultAction = () => {
      if (board) {
        onSelect({ selectedBoard: board, selectedPort: port });
      } else {
        onEdit({ selectedPort: port, query: { action: 'clear-if-not-empty' } });
      }
    };
    const onKeyUp = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onDefaultAction();
      }
    };
    return (
      <div
        key={`board-item--${boardLabel}-${port.address}`}
        className={classNames('arduino-boards-dropdown-item', {
          'arduino-boards-dropdown-item--selected': selected,
        })}
        onClick={onDefaultAction}
        onKeyUp={onKeyUp}
        tabIndex={0}
      >
        <div
          className={classNames(
            'arduino-boards-dropdown-item--protocol',
            'fa',
            iconNameFromProtocol(port.protocol)
          )}
        />
        <div
          className="arduino-boards-dropdown-item--label"
          title={`${boardLabel}${boardFqbn ? ` (${boardFqbn})` : ''}\n${
            port.address
          }`}
        >
          <div className="arduino-boards-dropdown-item--board-name">
            <div className="arduino-boards-dropdown-item--board-label noWrapInfo noselect">
              {boardLabel}
            </div>
          </div>
          <div className="arduino-boards-dropdown-item--port-label noWrapInfo noselect">
            {port.addressLabel}
          </div>
        </div>
        {isInferredBoardListItem(item) &&
          this.renderActions(item, onSelect, onEdit)}
      </div>
    );
  }

  private renderActions(
    inferredItem: InferredBoardListItem,
    onRevert: SelectBoardsConfigAction,
    onEdit: EditBoardsConfigAction
  ): React.ReactNode {
    const { port } = inferredItem;
    const edit = (
      <div
        id="edit"
        className={codicon('pencil', true)}
        title={nls.localize(
          'arduino/board/editBoardsConfig',
          'Edit Board and Port...'
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onEdit({
            query: inferredItem.inferredBoard.name,
            selectedBoard: inferredItem.inferredBoard,
            selectedPort: port,
          });
        }}
      />
    );
    const revert =
      inferredItem.type === 'board-overridden' ? (
        <div
          id="revert"
          className={codicon('discard', true)}
          title={nls.localize(
            'arduino/board/revertBoardsConfig',
            "Revert the selected '{0}' board to '{1}' detected on '{2}'",
            inferredItem.inferredBoard.name,
            inferredItem.board.name,
            port.address
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRevert({ selectedBoard: inferredItem.board, selectedPort: port });
          }}
        />
      ) : undefined;
    return (
      <div className={TabBarToolbar.Styles.TAB_BAR_TOOLBAR}>
        <div className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}>
          {edit}
        </div>
        <div className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}>
          {revert}
        </div>
      </div>
    );
  }
}

export class BoardsToolBarItem extends React.Component<
  BoardsToolBarItem.Props,
  BoardsToolBarItem.State
> {
  static TOOLBAR_ID: 'boards-toolbar';

  private readonly toDispose: DisposableCollection;

  constructor(props: BoardsToolBarItem.Props) {
    super(props);
    const { boardList } = props.boardsServiceProvider;
    this.state = {
      boardList,
      coords: 'hidden',
    };
    const listener = () => this.setState({ coords: 'hidden' });
    document.addEventListener('click', listener);
    this.toDispose = new DisposableCollection(
      Disposable.create(() => document.removeEventListener('click', listener))
    );
  }

  override componentDidMount(): void {
    this.toDispose.push(
      this.props.boardsServiceProvider.onBoardListDidChange((boardList) =>
        this.setState({ boardList })
      )
    );
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private readonly show = (event: React.MouseEvent<HTMLElement>): void => {
    const { currentTarget: element } = event;
    if (element instanceof HTMLElement) {
      if (this.state.coords === 'hidden') {
        const rect = element.getBoundingClientRect();
        this.setState({
          coords: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            paddingTop: rect.height,
          },
        });
      } else {
        this.setState({ coords: 'hidden' });
      }
    }
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  };

  private readonly hide = () => {
    this.setState({ coords: 'hidden' });
  };

  override render(): React.ReactNode {
    const { coords, boardList } = this.state;
    const { selectedBoard, selectedPort } = boardList.boardsConfig;

    const boardLabel =
      selectedBoard?.name ||
      nls.localize('arduino/board/selectBoard', 'Select Board');
    const boardFqbn = selectedBoard?.fqbn;
    const selectedItem: BoardListItem | undefined =
      boardList[boardList.selectedIndex];
    let tooltip = `${boardLabel}${boardFqbn ? ` (${boardFqbn})` : ''}${
      selectedPort ? `\n${selectedPort.address}` : ''
    }`;
    if (selectedPort && !selectedItem) {
      tooltip += ` ${nls.localize(
        'arduino/common/notConnected',
        '[not connected]'
      )}`;
    }

    const isConnected = boardList.selectedIndex >= 0;
    const protocolIcon = isConnected
      ? iconNameFromProtocol(selectedPort?.protocol || '')
      : null;
    const protocolIconClassNames = classNames(
      'arduino-boards-toolbar-item--protocol',
      'fa',
      protocolIcon
    );
    const originalOnSelect = boardList.onSelect;
    boardList['onSelect'] = (params) => {
      this.hide();
      return originalOnSelect.bind(boardList)(params);
    };
    const originalOnEdit = boardList.onEdit;
    boardList['onEdit'] = (params) => {
      this.hide();
      return originalOnEdit.bind(boardList)(params);
    };
    return (
      <React.Fragment>
        <div
          className="arduino-boards-toolbar-item-container"
          title={tooltip}
          onClick={this.show}
        >
          {protocolIcon && <div className={protocolIconClassNames} />}
          <div
            className={classNames(
              'arduino-boards-toolbar-item--label',
              'noWrapInfo',
              'noselect',
              { 'arduino-boards-toolbar-item--label-connected': isConnected }
            )}
          >
            {boardLabel}
          </div>
          <div className="fa fa-caret-down caret" />
        </div>
        <BoardListDropDown
          coords={coords}
          boardList={boardList}
          openBoardsConfig={() =>
            boardList.onEdit({ query: { action: 'clear-if-not-empty' } })
          }
        />
      </React.Fragment>
    );
  }
}
export namespace BoardsToolBarItem {
  export interface Props {
    readonly boardsServiceProvider: BoardsServiceProvider;
    readonly commands: CommandRegistry;
  }

  export interface State {
    boardList: BoardListUI;
    coords: BoardsDropDownListCoords | 'hidden';
  }
}

function iconNameFromProtocol(protocol: string): string {
  switch (protocol) {
    case 'serial':
      return 'fa-arduino-technology-usb';
    case 'network':
      return 'fa-arduino-technology-connection';
    // it is fine to assign dedicated icons to the protocols used by the official boards,
    // but other than that it is best to avoid implementing any special handling
    // for specific protocols in the IDE codebase.
    default:
      return 'fa-arduino-technology-3dimensionscube';
  }
}
