import { AbstractDialog, DialogProps, Widget, Panel, DialogError } from '@theia/core/lib/browser';
import { injectable, inject } from 'inversify';
import { SelectBoardDialogWidget, BoardAndPortSelection } from './select-board-dialog-widget';
import { Message } from '@phosphor/messaging';
import { Disposable } from '@theia/core';

@injectable()
export class SelectBoardsDialogProps extends DialogProps {

}

@injectable()
export class SelectBoardsDialog extends AbstractDialog<BoardAndPortSelection> {

    protected readonly dialogPanel: Panel;

    constructor(
        @inject(SelectBoardsDialogProps) protected readonly props: SelectBoardsDialogProps,
        @inject(SelectBoardDialogWidget) protected readonly widget: SelectBoardDialogWidget
    ) {
        super({ title: props.title });

        this.dialogPanel = new Panel();
        this.dialogPanel.addWidget(this.widget);

        this.toDispose.push(this.widget.onChanged(() => this.update()));

        this.toDispose.push(this.dialogPanel);

        this.appendCloseButton('CANCEL');
        this.appendAcceptButton('OK');
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
        return this.widget.boardAndPort;
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