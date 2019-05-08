import { AbstractDialog, ReactRenderer, Message } from "@theia/core/lib/browser";
import { Board, BoardsService } from "../../common/protocol/boards-service";
import * as React from 'react';

interface BoardGroup {
    name: string
    boards: Board[]
}

class DialogContentRenderer extends ReactRenderer {
    protected availableBoards: BoardGroup[] = [ ];
    protected searchTerm = "";

    constructor(protected readonly boardsService: BoardsService, protected readonly onSelect: (b: Board) => void) {
        super();
        this.search();
    }

    doRender(): React.ReactNode {
        return <React.Fragment>
            <input type="text" placeholder="Search ..." onChange={this.onSearchChange.bind(this)} value={this.searchTerm} />
            <select size={10} onChange={this.onChange.bind(this)}>
            { this.availableBoards.map((b, i) => (
                <optgroup key={"pkg" + i} label={b.name}>
                    { b.boards.map((brd, j) => <option key={j} value={`${i}::${j}`}>{brd.name}</option>) }
                </optgroup>
            )) }
            </select>
        </React.Fragment>;
    }

    protected onChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        const [grp, brd] = evt.target.value.split("::");

        const grpidx = parseInt(grp, 10);
        const brdidx = parseInt(brd, 10);

        const board = this.availableBoards[grpidx].boards[brdidx];
        this.onSelect(board);
    }

    protected onSearchChange(evt: React.ChangeEvent<HTMLInputElement>) {
        this.searchTerm = evt.target.value;
        this.search();
    }

    protected async search() {
        const { items } = await this.boardsService.search({query: this.searchTerm });
        this.availableBoards = items.map(pkg => {
            const result: BoardGroup = {
                name: pkg.name,
                boards: pkg.boards.filter(b => b.name.toLocaleLowerCase().includes(this.searchTerm.toLocaleLowerCase()))
            }
            return result;
        }).filter(grp => !!grp.boards).sort((a, b) => {
            if (a.name < b.name) return -1;
            if (a.name === b.name) return 0;
            return 1;
        });

        this.render();
    }

}

export class SelectBoardDialog extends AbstractDialog<Board> {
    protected result: Board;
    protected readonly contentRenderer: DialogContentRenderer;

    constructor(boardsService: BoardsService) {
        super({ title: 'Select other board' });

        this.contentNode.classList.add(SelectBoardDialog.Styles.DIALOG_CLASS);
        this.contentRenderer = new DialogContentRenderer(boardsService, b => this.result = b);
        this.contentRenderer.render();
        this.contentNode.appendChild(this.contentRenderer.host);

        this.appendCloseButton();
        this.appendAcceptButton("Select");
    }

    get value(): Board {
        return this.result;
    }

    onUpdateRequest(msg: Message) {
        super.onUpdateRequest(msg);
        this.contentRenderer.render();
    }

    dispose() {
        this.contentRenderer.dispose();
        super.dispose();
    }

}

export namespace SelectBoardDialog {
    export namespace Styles {
        export const DIALOG_CLASS = "select-board-dialog";
        export const SELECTOR_CLASS = "selector";
    }
}
