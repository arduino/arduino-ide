import { injectable, postConstruct, inject } from 'inversify';
import { Message } from '@phosphor/messaging';
import { addEventListener } from '@theia/core/lib/browser/widgets/widget';
import { AbstractDialog, DialogProps } from '@theia/core/lib/browser/dialogs';
import { LibraryPackage, LibraryService } from '../../common/protocol/library-service';
import { ListWidget } from '../widgets/component-list/list-widget';
import { Installable } from '../../common/protocol';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';

@injectable()
export class LibraryListWidget extends ListWidget<LibraryPackage> {

    static WIDGET_ID = 'library-list-widget';
    static WIDGET_LABEL = 'Library Manager';

    constructor(
        @inject(LibraryService) protected service: LibraryService,
        @inject(ListItemRenderer) protected itemRenderer: ListItemRenderer<LibraryPackage>) {

        super({
            id: LibraryListWidget.WIDGET_ID,
            label: LibraryListWidget.WIDGET_LABEL,
            iconClass: 'library-tab-icon',
            searchable: service,
            installable: service,
            itemLabel: (item: LibraryPackage) => item.name,
            itemRenderer
        });
    }

    @postConstruct()
    protected init(): void {
        super.init();
        this.toDispose.pushAll([
            this.notificationCenter.onLibraryInstalled(() => this.refresh(undefined)),
            this.notificationCenter.onLibraryUninstalled(() => this.refresh(undefined)),
        ]);
    }

    protected async install({ item, progressId, version }: { item: LibraryPackage, progressId: string, version: Installable.Version }): Promise<void> {
        const dependencies = await this.service.listDependencies({ item, version, filterSelf: true });
        let installDependencies: boolean | undefined = undefined;
        if (dependencies.length) {
            const message = document.createElement('div');
            message.innerHTML = `The library <b>${item.name}:${version}</b> needs ${dependencies.length === 1 ? 'another dependency' : 'some other dependencies'} currently not installed:`;
            const listContainer = document.createElement('div');
            listContainer.style.maxHeight = '300px';
            listContainer.style.overflowY = 'auto';
            const list = document.createElement('ul');
            list.style.listStyleType = 'none';
            for (const { name } of dependencies) {
                const listItem = document.createElement('li');
                listItem.textContent = ` - ${name}`;
                listItem.style.fontWeight = 'bold';
                list.appendChild(listItem);
            }
            listContainer.appendChild(list);
            message.appendChild(listContainer);
            const question = document.createElement('div');
            question.textContent = `Would you like to install ${dependencies.length === 1 ? 'the missing dependency' : 'all the missing dependencies'}?`;
            message.appendChild(question);
            const result = await new MessageBoxDialog({
                title: `Dependencies for library ${item.name}:${version}`,
                message,
                buttons: [
                    'Install all',
                    `Install ${item.name} only`,
                    'Cancel'
                ],
                maxWidth: 740 // Aligned with `settings-dialog.css`.
            }).open();

            if (result) {
                const { response } = result;
                if (response === 0) { // All
                    installDependencies = true;
                } else if (response === 1) { // Current only
                    installDependencies = false;
                }
            }
        } else {
            // The lib does not have any dependencies.
            installDependencies = false;
        }

        if (typeof installDependencies === 'boolean') {
            await this.service.install({ item, version, progressId, installDependencies });
            this.messageService.info(`Successfully installed library ${item.name}:${version}`, { timeout: 3000 });
        }
    }

    protected async uninstall({ item, progressId }: { item: LibraryPackage, progressId: string }): Promise<void> {
        await super.uninstall({ item, progressId });
        this.messageService.info(`Successfully uninstalled library ${item.name}:${item.installedVersion}`, { timeout: 3000 });
    }

}

class MessageBoxDialog extends AbstractDialog<MessageBoxDialog.Result> {

    protected response: number;

    constructor(protected readonly options: MessageBoxDialog.Options) {
        super(options);
        this.contentNode.appendChild(this.createMessageNode(this.options.message));
        (options.buttons || ['OK']).forEach((text, index) => {
            const button = this.createButton(text);
            button.classList.add(index === 0 ? 'main' : 'secondary');
            this.controlPanel.appendChild(button);
            this.toDisposeOnDetach.push(addEventListener(button, 'click', () => {
                this.response = index;
                this.accept();
            }));
        });
    }

    protected onCloseRequest(message: Message): void {
        super.onCloseRequest(message);
        this.accept();
    }

    get value(): MessageBoxDialog.Result {
        return { response: this.response };
    }

    protected createMessageNode(message: string | HTMLElement): HTMLElement {
        if (typeof message === 'string') {
            const messageNode = document.createElement('div');
            messageNode.textContent = message;
            return messageNode;
        }
        return message;
    }

    protected handleEnter(event: KeyboardEvent): boolean | void {
        this.response = 0;
        super.handleEnter(event);
    }

}
export namespace MessageBoxDialog {
    export interface Options extends DialogProps {
        /**
         * When empty, `['OK']` will be inferred.
         */
        buttons?: string[];
        message: string | HTMLElement;
    }
    export interface Result {
        /**
         * The index of `buttons` that was clicked.
         */
        readonly response: number;
    }
}
