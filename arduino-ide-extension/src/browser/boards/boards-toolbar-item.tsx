import { TabBarToolbar } from '@theia/core/lib/browser/shell/tab-bar-toolbar/tab-bar-toolbar';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { CommandRegistry } from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import React from '@theia/core/shared/react';
import ReactDOM from '@theia/core/shared/react-dom';
import classNames from 'classnames';
import { boardIdentifierLabel, Port } from '../../common/protocol';
import { BoardListItemUI } from '../../common/protocol/board-list';
import { assertUnreachable } from '../../common/utils';
import type {
  BoardListUI,
  BoardsServiceProvider,
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
    readonly hide: () => void;
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
          {boardList.items.map((item, index) =>
            this.renderBoardListItem({
              item,
              selected: index === boardList.selectedIndex,
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

  private readonly onDefaultAction = (item: BoardListItemUI): unknown => {
    const { boardList, hide } = this.props;
    const { type, params } = item.defaultAction;
    hide();
    switch (type) {
      case 'select-boards-config': {
        return boardList.select(params);
      }
      case 'edit-boards-config': {
        return boardList.edit(params);
      }
      default:
        return assertUnreachable(type);
    }
  };

  private renderBoardListItem({
    item,
    selected,
  }: {
    item: BoardListItemUI;
    selected: boolean;
  }): React.ReactNode {
    const { boardLabel, portLabel, portProtocol, tooltip } = item.labels;
    const port = item.port;
    const onKeyUp = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.onDefaultAction(item);
      }
    };
    return (
      <div
        key={`board-item--${Port.keyOf(port)}`}
        className={classNames('arduino-boards-dropdown-item', {
          'arduino-boards-dropdown-item--selected': selected,
        })}
        onClick={() => this.onDefaultAction(item)}
        onKeyUp={onKeyUp}
        tabIndex={0}
      >
        <div
          className={classNames(
            'arduino-boards-dropdown-item--protocol',
            'fa',
            iconNameFromProtocol(portProtocol)
          )}
        />
        <div className="arduino-boards-dropdown-item--label" title={tooltip}>
          <div className="arduino-boards-dropdown-item--board-header">
            <div className="arduino-boards-dropdown-item--board-label noWrapInfo noselect">
              {boardLabel}
            </div>
          </div>
          <div className="arduino-boards-dropdown-item--port-label noWrapInfo noselect">
            {portLabel}
          </div>
        </div>
        {this.renderActions(item)}
      </div>
    );
  }

  private renderActions(item: BoardListItemUI): React.ReactNode {
    const { boardList, hide } = this.props;
    const { revert, edit } = item.otherActions;
    if (!edit && !revert) {
      return undefined;
    }
    const handleOnClick = (
      event: React.MouseEvent<HTMLElement, MouseEvent>,
      callback: () => void
    ) => {
      event.preventDefault();
      event.stopPropagation();
      hide();
      callback();
    };
    return (
      <div className={TabBarToolbar.Styles.TAB_BAR_TOOLBAR}>
        {edit && (
          <div
            className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}
          >
            {
              <div
                id="edit"
                className={codicon('pencil', true)}
                title={'编辑开发板和端口……'}
                onClick={(event) =>
                  handleOnClick(event, () => boardList.edit(edit.params))
                }
              />
            }
          </div>
        )}
        {revert && (
          <div
            className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}
          >
            {
              <div
                id="revert"
                className={codicon('discard', true)}
                title={nls.localize(
                  'arduino/board/revertBoardsConfig',
                  "Use '{0}' discovered on '{1}'",
                  boardIdentifierLabel(revert.params.selectedBoard),
                  item.labels.portLabel
                )}
                onClick={(event) =>
                  handleOnClick(event, () => boardList.select(revert.params))
                }
              />
            }
          </div>
        )}
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
    const { boardLabel, selected, portProtocol, tooltip } = boardList.labels;
    const protocolIcon = portProtocol
      ? iconNameFromProtocol(portProtocol)
      : null;
    const protocolIconClassNames = classNames(
      'arduino-boards-toolbar-item--protocol',
      'fa',
      protocolIcon
    );
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
              { 'arduino-boards-toolbar-item--label-connected': selected }
            )}
          >
            {boardLabel}
          </div>
          <div className="fa fa-caret-down caret" />
        </div>
        <BoardListDropDown
          coords={coords}
          boardList={boardList}
          openBoardsConfig={() => boardList.edit({ query: '' })}
          hide={this.hide}
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
