import * as React from 'react';
import { BoardsService, Board } from '../../common/protocol/boards-service';
// import { SelectBoardDialog } from './select-board-dialog';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { BoardsNotificationService } from '../boards-notification-service';
import { ARDUINO_TOOLBAR_ITEM_CLASS } from '../toolbar/arduino-toolbar';

export class ConnectedBoards extends React.Component<ConnectedBoards.Props, ConnectedBoards.State> {
    static TOOLBAR_ID: 'connected-boards-toolbar';

    constructor(props: ConnectedBoards.Props) {
        super(props);
        this.state = { boardsLoading: false };

        props.boardsNotificationService.on('boards-installed', () => this.onBoardsInstalled());
    }

    render(): React.ReactNode {
        let content = [];
        if (!!this.state.boards && this.state.boards.length > 0) {
            content = this.state.boards.map((b, i) => <option value={i} key={i}>{b.name}</option>);
        } else {
            let label;
            if (this.state.boardsLoading) {
                label = "Loading ...";
            } else {
                label = "No board attached";
            }
            content = [ <option key="loading" value="0">{label}</option> ];
        }

        return <div key='arduino-connected-boards' className={`${ARDUINO_TOOLBAR_ITEM_CLASS} item ${ConnectedBoards.Styles.CONNECTED_BOARDS_CLASS}`}>
            <select key='arduino-connected-boards-select' disabled={!this.state.boards}
                onChange={this.onBoardSelect.bind(this)}
                value={this.state.selection}>
                <optgroup key='arduino-connected-boards-select-opt-group' label="Attached boards">
                    { content }
                </optgroup>
                <optgroup label="_________" key='arduino-connected-boards-select-opt-group2'>
                    { !!this.state.otherBoard && <option value="selected-other" key="selected-other">{this.state.otherBoard.name} (not attached)</option> }
                    <option value="select-other" key="select-other">Select other Board</option>
                </optgroup>
            </select>
        </div>;
    }

    componentDidMount(): void {
        this.reloadBoards();
    }

    protected onBoardsInstalled() {
        if (!!this.findUnknownBoards()) {
            this.reloadBoards();
        }
    }

    protected findUnknownBoards(): Board[] {
        if (!this.state || !this.state.boards) {
            return [];
        }

        return this.state.boards.filter(b => !b.fqbn || b.name === "unknown");
    }

    protected async reloadBoards() {
        const prevSelection = this.state.selection;
        this.setState({ boardsLoading: true, boards: undefined, selection: "loading" });
        const { boards } = await this.props.boardsService.getAttachedBoards()
        this.setState({ boards, boardsLoading: false, selection: prevSelection });

        if (boards) {
            this.setState({ selection: "0" });
            await this.props.boardsService.selectBoard(boards[0]);

            const unknownBoards = this.findUnknownBoards();
            if (unknownBoards && unknownBoards.length > 0) {
                this.props.onUnknownBoard(unknownBoards[0]);
            }
        }
    }

    protected async onBoardSelect(evt: React.ChangeEvent<HTMLSelectElement>) {
        const selection = evt.target.value;
        if (selection === "select-other" || selection === "selected-other") {
            let selectedBoard = this.state.otherBoard;
            if (selection === "select-other" || !selectedBoard) {
                selectedBoard = await this.selectedInstalledBoard();
            }
            if (!selectedBoard) {
                return;
            }

            await this.props.boardsService.selectBoard(selectedBoard);
            this.setState({otherBoard: selectedBoard, selection: "selected-other"});
            return;
        }

        const selectedBoard = (this.state.boards || [])[parseInt(selection, 10)];
        if (!selectedBoard) {
            return;
        }
        await this.props.boardsService.selectBoard(selectedBoard);
        this.setState({selection});
    }

    protected async selectedInstalledBoard(): Promise<Board | undefined> {
        const {items} = await this.props.boardsService.search({});

        const idx = new Map<string, Board>();
        items.filter(pkg => !!pkg.installedVersion).forEach(pkg => pkg.boards.forEach(brd => idx.set(`${brd.name}`, brd) ));

        if (idx.size === 0) {
            this.props.onNoBoardsInstalled();
            return;
        }

        const selection = await this.props.quickPickService.show(Array.from(idx.keys()));
        if (!selection) {
            return;
        }

        return idx.get(selection);
    }

}

export namespace ConnectedBoards {

    export interface Props {
        readonly boardsService: BoardsService;
        readonly boardsNotificationService: BoardsNotificationService;
        readonly quickPickService: QuickPickService;
        readonly onNoBoardsInstalled: () => void;
        readonly onUnknownBoard: (board: Board) => void;
    }

    export interface State {
        boardsLoading: boolean;
        boards?: Board[];
        otherBoard?: Board;
        selection?: string;
    }

    export namespace Styles {
        export const CONNECTED_BOARDS_CLASS = 'connected-boards';
    }

}