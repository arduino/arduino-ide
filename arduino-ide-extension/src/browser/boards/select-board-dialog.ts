import { AbstractDialog, DialogProps, Widget, Panel, DialogError } from '@theia/core/lib/browser';
import { injectable, inject } from 'inversify';
import { SelectBoardDialogWidget, BoardAndPortSelection } from './select-board-dialog-widget';
import { Message } from '@phosphor/messaging';
import { Disposable } from '@theia/core';
import { Board, BoardsService, AttachedSerialBoard } from '../../common/protocol/boards-service';

@injectable()
export class SelectBoardDialogProps extends DialogProps {

}

@injectable()
export class SelectBoardDialog extends AbstractDialog<BoardAndPortSelection> {

    protected readonly dialogPanel: Panel;
    protected attachedBoards: Board[];

    constructor(
        @inject(SelectBoardDialogProps) protected readonly props: SelectBoardDialogProps,
        @inject(SelectBoardDialogWidget) protected readonly widget: SelectBoardDialogWidget,
        @inject(BoardsService) protected readonly boardService: BoardsService
    ) {
        super({ title: props.title });

        this.dialogPanel = new Panel();
        this.dialogPanel.addWidget(this.widget);

        this.contentNode.classList.add('select-board-dialog');

        this.toDispose.push(this.widget.onChanged(() => this.update()));
        this.toDispose.push(this.dialogPanel);

        this.attachedBoards = [];
        this.init();

        this.appendCloseButton('CANCEL');
        this.appendAcceptButton('OK');
    }

    protected init() {
        const boards = this.boardService.getAttachedBoards();
        boards.then(b => this.attachedBoards = b.boards);
        this.widget.setAttachedBoards(boards);
    }

    protected onAfterAttach(msg: Message): void {
        Widget.attach(this.dialogPanel, this.contentNode);

        this.toDisposeOnDetach.push(Disposable.create(() => {
            Widget.detach(this.dialogPanel);
        }))

        super.onAfterAttach(msg);
        this.update();
    }

    protected onUpdateRequest(msg: Message) {
        super.onUpdateRequest(msg);
        this.widget.update();
    }

    protected onActivateRequest(msg: Message): void {
        this.widget.activate();
    }

    protected handleEnter(event: KeyboardEvent): boolean | void {
        if (event.target instanceof HTMLTextAreaElement) {
            return false;
        }
    }

    protected isValid(value: BoardAndPortSelection): DialogError {
        if (!value.board) {
            if (value.port) {
                return 'Please pick the Board connected to the Port you have selected';
            }
            return false;
        }
        return '';
    }

    get value(): BoardAndPortSelection {
        const boardAndPortSelection = this.widget.boardAndPort;
        if (this.attachedBoards.length) {
            boardAndPortSelection.board = this.attachedBoards.find(b => {
                const isAttachedBoard = !!boardAndPortSelection.board &&
                    b.name === boardAndPortSelection.board.name &&
                    b.fqbn === boardAndPortSelection.board.fqbn;
                if (boardAndPortSelection.port) {
                    return isAttachedBoard &&
                        AttachedSerialBoard.is(b) &&
                        b.port === boardAndPortSelection.port;
                } else {
                    return isAttachedBoard;
                }

            })
                || boardAndPortSelection.board;
        }
        return boardAndPortSelection;
    }

    close(): void {
        this.widget.reset();
        super.close();
    }

    onAfterDetach(msg: Message) {
        this.widget.reset();
        super.onAfterDetach(msg);
    }
}