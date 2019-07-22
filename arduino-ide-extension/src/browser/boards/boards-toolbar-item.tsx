import * as React from 'react';
import { BoardsService, Board, AttachedSerialBoard } from '../../common/protocol/boards-service';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { BoardsNotificationService } from '../boards-notification-service';
import { Command, CommandRegistry } from '@theia/core';
import { ArduinoCommands } from '../arduino-commands';
import ReactDOM = require('react-dom');

export interface BoardsDropdownItem {
    label: string;
    commandExecutor: () => void;
    isSelected: () => boolean;
}

export interface BoardsDropDownListCoord {
    top: number;
    left: number;
    width: number;
    paddingTop: number;
}

export namespace BoardsDropdownItemComponent {
    export interface Props {
        label: string;
        onClick: () => void;
        isSelected: boolean;
    }
}

export class BoardsDropdownItemComponent extends React.Component<BoardsDropdownItemComponent.Props> {
    render() {
        return <div className={`arduino-boards-dropdown-item ${this.props.isSelected ? 'selected' : ''}`} onClick={this.props.onClick}>
            <div>{this.props.label}</div>
            {this.props.isSelected ? <span className='fa fa-check'></span> : ''}
        </div>;
    }
}

export namespace BoardsDropDown {
    export interface Props {
        readonly coords: BoardsDropDownListCoord;
        readonly isOpen: boolean;
        readonly dropDownItems: BoardsDropdownItem[];
        readonly openDialog: () => void;
    }
}

export class BoardsDropDown extends React.Component<BoardsDropDown.Props> {
    protected dropdownId: string = 'boards-dropdown-container';
    protected dropdownElement: HTMLElement;

    constructor(props: BoardsDropDown.Props) {
        super(props);

        let list = document.getElementById(this.dropdownId);
        if (!list) {
            list = document.createElement('div');
            list.id = this.dropdownId;
            document.body.appendChild(list);
            this.dropdownElement = list;
        }
    }

    render(): React.ReactNode {
        return ReactDOM.createPortal(this.renderNode(), this.dropdownElement);
    }

    renderNode(): React.ReactNode {
        if (this.props.isOpen) {
            return <div className='arduino-boards-dropdown-list'
                style={{
                    position: 'absolute',
                    top: this.props.coords.top,
                    left: this.props.coords.left,
                    width: this.props.coords.width,
                    paddingTop: this.props.coords.paddingTop
                }}>
                {
                    this.props.dropDownItems.map(item => {
                        return <React.Fragment key={item.label}>
                            <BoardsDropdownItemComponent isSelected={item.isSelected()} label={item.label} onClick={item.commandExecutor}></BoardsDropdownItemComponent>
                        </React.Fragment>;
                    })
                }
                <BoardsDropdownItemComponent isSelected={false} label={'Select Other Board & Port'} onClick={this.props.openDialog}></BoardsDropdownItemComponent>
            </div>
        } else {
            return '';
        }
    }
}

export namespace BoardsToolBarItem {
    export interface Props {
        readonly contextMenuRenderer: ContextMenuRenderer;
        readonly boardsNotificationService: BoardsNotificationService;
        readonly boardService: BoardsService;
        readonly commands: CommandRegistry;
    }

    export interface State {
        selectedBoard?: Board;
        selectedIsAttached: boolean;
        boardItems: BoardsDropdownItem[];
        isOpen: boolean;
    }
}

export class BoardsToolBarItem extends React.Component<BoardsToolBarItem.Props, BoardsToolBarItem.State> {

    protected attachedBoards: Board[];
    protected dropDownListCoord: BoardsDropDownListCoord;

    constructor(props: BoardsToolBarItem.Props) {
        super(props);

        this.state = {
            selectedBoard: undefined,
            selectedIsAttached: true,
            boardItems: [],
            isOpen: false
        };

        document.addEventListener('click', () => {
            this.setState({ isOpen: false });
        });
    }

    componentDidMount() {
        this.setAttachedBoards();
    }

    setSelectedBoard(board: Board) {
        if (this.attachedBoards && this.attachedBoards.length) {
            this.setState({ selectedIsAttached: !!this.attachedBoards.find(attachedBoard => attachedBoard.name === board.name) });
        }
        this.setState({ selectedBoard: board });
    }

    protected async setAttachedBoards() {
        const { boards } = await this.props.boardService.getAttachedBoards();
        this.attachedBoards = boards;
        if (this.attachedBoards.length) {
            await this.createBoardDropdownItems();
            await this.props.boardService.selectBoard(this.attachedBoards[0]);
            this.setSelectedBoard(this.attachedBoards[0]);
        }
    }

    protected createBoardDropdownItems() {
        const boardItems: BoardsDropdownItem[] = [];
        this.attachedBoards.forEach(board => {
            const { commands } = this.props;
            const port = this.getPort(board);
            const command: Command = {
                id: 'selectBoard' + port
            }
            commands.registerCommand(command, {
                execute: () => {
                    commands.executeCommand(ArduinoCommands.SELECT_BOARD.id, board);
                    this.setState({ isOpen: false, selectedBoard: board });
                }
            });
            boardItems.push({
                commandExecutor: () => commands.executeCommand(command.id),
                label: board.name + ' at ' + port,
                isSelected: () => this.doIsSelectedBoard(board)
            });
        });
        this.setState({ boardItems });
    }

    protected doIsSelectedBoard = (board: Board) => this.isSelectedBoard(board);
    protected isSelectedBoard(board: Board): boolean {
        return AttachedSerialBoard.is(board) &&
            !!this.state.selectedBoard &&
            AttachedSerialBoard.is(this.state.selectedBoard) &&
            board.port === this.state.selectedBoard.port &&
            board.fqbn === this.state.selectedBoard.fqbn;
    }

    protected getPort(board: Board): string {
        if (AttachedSerialBoard.is(board)) {
            return board.port;
        }
        return '';
    }

    protected readonly doShowSelectBoardsMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.showSelectBoardsMenu(event);
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    };
    protected showSelectBoardsMenu(event: React.MouseEvent<HTMLElement>) {
        const el = (event.currentTarget as HTMLElement);
        if (el) {
            this.dropDownListCoord = {
                top: el.getBoundingClientRect().top,
                left: el.getBoundingClientRect().left,
                paddingTop: el.getBoundingClientRect().height,
                width: el.getBoundingClientRect().width
            }
            this.setState({ isOpen: !this.state.isOpen });
        }
    }

    render(): React.ReactNode {
        const selectedBoard = this.state.selectedBoard;
        const port = selectedBoard ? this.getPort(selectedBoard) : undefined;
        return <React.Fragment>
            <div className='arduino-boards-toolbar-item-container'>
                <div className='arduino-boards-toolbar-item' title={selectedBoard && `${selectedBoard.name}${port ? ' at ' + port : ''}`}>
                    <div className='inner-container' onClick={this.doShowSelectBoardsMenu}>
                        <span className={!selectedBoard || !this.state.selectedIsAttached ? 'fa fa-times notAttached' : ''}></span>
                        <div className='label noWrapInfo'>
                            <div className='noWrapInfo'>
                                {selectedBoard ? `${selectedBoard.name}${port ? ' at ' + port : ''}` : 'no board selected'}
                            </div>
                        </div>
                        <span className='fa fa-caret-down caret'></span>
                    </div>
                </div>
            </div>
            <BoardsDropDown
                isOpen={this.state.isOpen}
                coords={this.dropDownListCoord}
                dropDownItems={this.state.boardItems}
                openDialog={this.openDialog}>
            </BoardsDropDown>
        </React.Fragment>;
    }

    protected openDialog = () => {
        this.props.commands.executeCommand(ArduinoCommands.OPEN_BOARDS_DIALOG.id);
        this.setState({ isOpen: false });
    };
}