import * as React from 'react';
// TODO: make this `async`.
// import { Async } from 'react-select/lib/Async';
import { BoardsService, AttachedBoard } from '../../common/protocol/boards-service';

export class ConnectedBoards extends React.Component<ConnectedBoards.Props, ConnectedBoards.State> {
    static TOOLBAR_ID: 'connected-boards-toolbar';

    constructor(props: ConnectedBoards.Props) {
        super(props);
        this.state = { boardsLoading: false };
    }

    render(): React.ReactNode {
        let label = "no board available";
        if (this.state.boardsLoading) {
            label = "Loading ...";
        } else if (!!this.state.current) {
            label = this.state.current.name;
        }

        let content = [];
        if (!!this.state.boards) {
            content = this.state.boards.map((b, i) => <option value={i} key={i}>{b.name}</option>);
        } else {
            content = [ <option key="loading" value="0">{label}</option> ];
        }

        return <div className={ConnectedBoards.Styles.CONNECTED_BOARDS_CLASS}>
            <select disabled={!this.state.boards} onChange={this.onBoardSelect.bind(this)}>
                { content }
            </select>
        </div>;
    }

    componentDidMount(): void {
        this.reloadBoards();
    }

    protected async reloadBoards() {
        this.setState({ boardsLoading: true, boards: undefined, current: undefined });
        const { boards } = await this.props.boardsService.getAttachedBoards()
        this.setState({ boards, boardsLoading: false });

        if (boards) {
            this.selectBoard(boards[0]);
        }
    }

    protected async onBoardSelect(evt: React.ChangeEvent<HTMLSelectElement>) {
        const selectedBoard = (this.state.boards || [])[parseInt(evt.target.value, 10)];
        if (!selectedBoard) {
            return;
        }
        this.selectBoard(selectedBoard);
    }

    protected async selectBoard(board: AttachedBoard) {
        await this.props.boardsService.selectBoard(board);
        this.setState({ current: board });
    }

}

export namespace ConnectedBoards {

    export interface Props {
        readonly boardsService: BoardsService;
    }

    export interface State {
        boardsLoading: boolean;
        boards?: AttachedBoard[];
        current?: AttachedBoard;
    }

    export namespace Styles {
        export const CONNECTED_BOARDS_CLASS = 'connected-boards';
    }

}