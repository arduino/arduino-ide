import * as React from '@theia/core/shared/react';
import * as ReactDOM from '@theia/core/shared/react-dom';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Port } from '../../common/protocol';
import { OpenBoardsConfig } from '../contributions/open-boards-config';
import {
  BoardsServiceProvider,
  AvailableBoard,
} from './boards-service-provider';
import { nls } from '@theia/core/lib/common';
import classNames from 'classnames';
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
    readonly items: Array<AvailableBoard & { onClick: () => void; port: Port }>;
    readonly openBoardsConfig: () => void;
  }
}

export class BoardsDropDown extends React.Component<BoardsDropDown.Props> {
  protected dropdownElement: HTMLElement;
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
    return ReactDOM.createPortal(this.renderNode(), this.dropdownElement);
  }

  protected renderNode(): React.ReactNode {
    const { coords, items } = this.props;
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
          {items
            .map(({ name, port, selected, onClick }) => ({
              boardLabel: name,
              port,
              selected,
              onClick,
            }))
            .map(this.renderItem)}
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

  protected renderItem({
    boardLabel,
    port,
    selected,
    onClick,
  }: {
    boardLabel: string;
    port: Port;
    selected?: boolean;
    onClick: () => void;
  }): React.ReactNode {
    const protocolIcon = iconNameFromProtocol(port.protocol);
    const onKeyUp = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onClick();
      }
    };

    return (
      <div
        key={`board-item--${boardLabel}-${port.address}`}
        className={classNames('arduino-boards-dropdown-item', {
          'arduino-boards-dropdown-item--selected': selected,
        })}
        onClick={onClick}
        onKeyUp={onKeyUp}
        tabIndex={0}
      >
        <div
          className={classNames(
            'arduino-boards-dropdown-item--protocol',
            'fa',
            protocolIcon
          )}
        />
        <div className="arduino-boards-dropdown-item--label">
          <div className="arduino-boards-dropdown-item--board-label">
            {boardLabel}
          </div>
          <div className="arduino-boards-dropdown-item--port-label">
            {port.address}
          </div>
        </div>
        {selected ? <div className="fa fa-check" /> : ''}
      </div>
    );
  }
}

export class BoardsToolBarItem extends React.Component<
  BoardsToolBarItem.Props,
  BoardsToolBarItem.State
> {
  static TOOLBAR_ID: 'boards-toolbar';

  protected readonly toDispose: DisposableCollection =
    new DisposableCollection();

  constructor(props: BoardsToolBarItem.Props) {
    super(props);

    const { availableBoards } = props.boardsServiceProvider;
    this.state = {
      availableBoards,
      coords: 'hidden',
    };

    document.addEventListener('click', () => {
      this.setState({ coords: 'hidden' });
    });
  }

  override componentDidMount(): void {
    this.props.boardsServiceProvider.onAvailableBoardsChanged(
      (availableBoards) => this.setState({ availableBoards })
    );
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  protected readonly show = (event: React.MouseEvent<HTMLElement>): void => {
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

  override render(): React.ReactNode {
    const { coords, availableBoards } = this.state;
    const selectedBoard = availableBoards.find(({ selected }) => selected);

    const boardLabel =
      selectedBoard?.name ||
      nls.localize('arduino/board/selectBoard', 'Select Board');
    const selectedPortLabel = portLabel(selectedBoard?.port?.address);

    const isConnected = Boolean(
      selectedBoard && AvailableBoard.hasPort(selectedBoard)
    );
    const protocolIcon = isConnected
      ? iconNameFromProtocol(selectedBoard?.port?.protocol || '')
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
          title={selectedPortLabel}
          onClick={this.show}
        >
          {protocolIcon && <div className={protocolIconClassNames} />}
          <div
            className={classNames(
              'arduino-boards-toolbar-item--label',
              'noWrapInfo noselect',
              { 'arduino-boards-toolbar-item--label-connected': isConnected }
            )}
          >
            {boardLabel}
          </div>
          <div className="fa fa-caret-down caret" />
        </div>
        <BoardsDropDown
          coords={coords}
          items={availableBoards
            .filter(AvailableBoard.hasPort)
            .map((board) => ({
              ...board,
              onClick: () => {
                if (board.state === AvailableBoard.State.incomplete) {
                  const previousBoardConfig =
                    this.props.boardsServiceProvider.boardsConfig;
                  this.props.boardsServiceProvider.boardsConfig = {
                    selectedPort: board.port,
                  };
                  this.openDialog(previousBoardConfig);
                } else {
                  this.props.boardsServiceProvider.boardsConfig = {
                    selectedBoard: board,
                    selectedPort: board.port,
                  };
                }
                this.setState({ coords: 'hidden' });
              },
            }))}
          openBoardsConfig={this.openDialog}
        ></BoardsDropDown>
      </React.Fragment>
    );
  }

  protected openDialog = async (
    previousBoardConfig?: BoardsConfig.Config
  ): Promise<void> => {
    const selectedBoardConfig =
      await this.props.commands.executeCommand<BoardsConfig.Config>(
        OpenBoardsConfig.Commands.OPEN_DIALOG.id
      );
    if (
      previousBoardConfig &&
      (!selectedBoardConfig?.selectedPort ||
        !selectedBoardConfig?.selectedBoard)
    ) {
      this.props.boardsServiceProvider.boardsConfig = previousBoardConfig;
    }
  };
}
export namespace BoardsToolBarItem {
  export interface Props {
    readonly boardsServiceProvider: BoardsServiceProvider;
    readonly commands: CommandRegistry;
  }

  export interface State {
    availableBoards: AvailableBoard[];
    coords: BoardsDropDownListCoords | 'hidden';
  }
}

function iconNameFromProtocol(protocol: string): string {
  switch (protocol) {
    case 'serial':
      return 'fa-arduino-technology-usb';
    case 'network':
      return 'fa-arduino-technology-connection';
    /* 
      Bluetooth ports are not listed yet from the CLI;
      Not sure about the naming ('bluetooth'); make sure it's correct before uncommenting the following lines
    */
    // case 'bluetooth':
    //   return 'fa-arduino-technology-bluetooth';
    default:
      return 'fa-arduino-technology-3dimensionscube';
  }
}

function portLabel(portName?: string): string {
  return portName
    ? nls.localize('arduino/board/portLabel', 'Port: {0}', portName)
    : nls.localize('arduino/board/disconnected', 'Disconnected');
}
