import { injectable, inject, postConstruct } from 'inversify';
import { Message } from '@phosphor/messaging';
import { AbstractDialog, DialogProps, Widget, DialogError } from '@theia/core/lib/browser';
import { BoardsService } from '../../common/protocol/boards-service';
import { BoardsConfig } from './boards-config';
import { BoardsConfigDialogWidget } from './boards-config-dialog-widget';
import { BoardsServiceProvider } from './boards-service-provider';

@injectable()
export class BoardsConfigDialogProps extends DialogProps {
}

@injectable()
export class BoardsConfigDialog extends AbstractDialog<BoardsConfig.Config> {

    @inject(BoardsConfigDialogWidget)
    protected readonly widget: BoardsConfigDialogWidget;

    @inject(BoardsService)
    protected readonly boardService: BoardsService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClient: BoardsServiceProvider;

    protected config: BoardsConfig.Config = {};

    constructor(@inject(BoardsConfigDialogProps) protected readonly props: BoardsConfigDialogProps) {
        super(props);

        this.contentNode.classList.add('select-board-dialog');
        this.contentNode.appendChild(this.createDescription());

        this.appendCloseButton('CANCEL');
        this.appendAcceptButton('OK');
    }

    @postConstruct()
    protected init(): void {
        this.toDispose.push(this.boardsServiceClient.onBoardsConfigChanged(config => {
            this.config = config;
            this.update();
        }));
    }

    protected createDescription(): HTMLElement {
        const head = document.createElement('div');
        head.classList.add('head');

        const title = document.createElement('div');
        title.textContent = 'Select Other Board & Port';
        title.classList.add('title');
        head.appendChild(title);

        const text = document.createElement('div');
        text.classList.add('text');
        head.appendChild(text);

        for (const paragraph of [
            'Select both a Board and a Port if you want to upload a sketch.',
            'If you only select a Board you will be able just to compile, but not to upload your sketch.'
        ]) {
            const p = document.createElement('p');
            p.textContent = paragraph;
            text.appendChild(p);
        }

        return head;
    }

    protected onAfterAttach(msg: Message): void {
        if (this.widget.isAttached) {
            Widget.detach(this.widget);
        }
        Widget.attach(this.widget, this.contentNode);
        this.toDisposeOnDetach.push(this.widget.onBoardConfigChanged(config => {
            this.config = config;
            this.update();
        }));
        super.onAfterAttach(msg);
        this.update();
    }

    protected onUpdateRequest(msg: Message) {
        super.onUpdateRequest(msg);
        this.widget.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.widget.activate();
    }

    protected handleEnter(event: KeyboardEvent): boolean | void {
        if (event.target instanceof HTMLTextAreaElement) {
            return false;
        }
    }

    protected isValid(value: BoardsConfig.Config): DialogError {
        if (!value.selectedBoard) {
            if (value.selectedPort) {
                return 'Please pick a board connected to the port you have selected.';
            }
            return false;
        }
        return '';
    }

    get value(): BoardsConfig.Config {
        return this.config;
    }

}
