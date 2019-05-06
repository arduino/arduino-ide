import * as React from 'react';
// TODO: make this `async`.
// import { Async } from 'react-select/lib/Async';
import { BoardsService, Board } from '../../common/protocol/boards-service';

export class ConnectedBoards extends React.Component<ConnectedBoards.Props, ConnectedBoards.State> {

    static TOOLBAR_ID: 'connected-boards-toolbar';

    render(): React.ReactNode {
        return <div className={ConnectedBoards.Styles.CONNECTED_BOARDS_CLASS}>
            {this.select(this.state ? this.state.boards : undefined, this.state ? this.state.current : undefined)}
        </div>;
    }

    componentDidMount(): void {
        this.props.boardsService.connectedBoards().then(result => {
            const { boards, current } = result;
            this.setState({
                boards,
                current
            })
        });
    }

    private select(boards: Board[] | undefined, current: Board | undefined): React.ReactNode {
        // Initial pessimistic.
        const options = [<option>Loading...</option>];
        if (boards) {
            options.length = 0;
            options.push(...boards.map(b => b.name).map(name => <option value={name} key={name}>{name}</option>));
        }
        const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
            const current = (boards || []).find(board => board.name === event.target.value);
            this.setState({ current });
        };
        return <select
            onChange={onChange}
            value={current ? current.name : 'Loading...'}
            name={current ? current.name : 'Loading...'}
        >
        {options}
        </select>
    }

}

export namespace ConnectedBoards {

    export interface Props {
        readonly boardsService: BoardsService;
    }

    export interface State {
        boards?: Board[];
        current?: Board;
    }

    export namespace Styles {
        export const CONNECTED_BOARDS_CLASS = 'connected-boards';
    }

}