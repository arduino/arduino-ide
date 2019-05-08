import * as React from 'react';
import { BoardsService, Board } from '../../common/protocol/boards-service';
import { SelectBoardDialog } from './select-board-dialog';

export class ConnectedBoards extends React.Component<ConnectedBoards.Props, ConnectedBoards.State> {
    static TOOLBAR_ID: 'connected-boards-toolbar';

    constructor(props: ConnectedBoards.Props) {
        super(props);
        this.state = { boardsLoading: false };
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

        return <div className={ConnectedBoards.Styles.CONNECTED_BOARDS_CLASS}>
            <select disabled={!this.state.boards} onChange={this.onBoardSelect.bind(this)} value={this.state.selection}>
                <optgroup label="Attached boards">
                    { content }
                </optgroup>
                <optgroup label="_________">
                    { !!this.state.otherBoard && <option value="selected-other" key="selected-other">{this.state.otherBoard.name} (not attached)</option> }
                    <option value="select-other" key="select-other">Select other Board</option>
                </optgroup>
            </select>
        </div>;
    }

    componentDidMount(): void {
        this.reloadBoards();
    }

    protected async reloadBoards() {
        this.setState({ boardsLoading: true, boards: undefined, selection: undefined });
        const { boards } = await this.props.boardsService.getAttachedBoards()
        this.setState({ boards, boardsLoading: false });

        if (boards) {
            this.setState({ selection: "0" });
            await this.props.boardsService.selectBoard(boards[0]);
        }
    }

    protected async onBoardSelect(evt: React.ChangeEvent<HTMLSelectElement>) {
        const selection = evt.target.value;
        if (selection === "select-other" || selection === "selected-other") {
            let selectedBoard = this.state.otherBoard;
            if (selection === "select-other" || !selectedBoard) {
                selectedBoard = await new SelectBoardDialog(this.props.boardsService).open();
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

}

export namespace ConnectedBoards {

    export interface Props {
        readonly boardsService: BoardsService;
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