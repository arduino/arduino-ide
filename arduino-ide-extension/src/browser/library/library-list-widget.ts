import {
  injectable,
  postConstruct,
  inject,
} from '@theia/core/shared/inversify';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { addEventListener } from '@theia/core/lib/browser/widgets/widget';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { AbstractDialog } from '../theia/dialogs/dialogs';
import {
  LibraryPackage,
  LibrarySearch,
  LibraryService,
} from '../../common/protocol/library-service';
import { ListWidget } from '../widgets/component-list/list-widget';
import { Installable } from '../../common/protocol';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';
import { nls } from '@theia/core/lib/common';
import { LibraryFilterRenderer } from '../widgets/component-list/filter-renderer';

@injectable()
export class LibraryListWidget extends ListWidget<
  LibraryPackage,
  LibrarySearch
> {
  static WIDGET_ID = 'library-list-widget';
  static WIDGET_LABEL = nls.localize(
    'arduino/library/title',
    'Library Manager'
  );

  constructor(
    @inject(LibraryService) private service: LibraryService,
    @inject(ListItemRenderer) itemRenderer: ListItemRenderer<LibraryPackage>,
    @inject(LibraryFilterRenderer) filterRenderer: LibraryFilterRenderer
  ) {
    super({
      id: LibraryListWidget.WIDGET_ID,
      label: LibraryListWidget.WIDGET_LABEL,
      iconClass: 'fa fa-arduino-library',
      searchable: service,
      installable: service,
      itemLabel: (item: LibraryPackage) => item.name,
      itemDeprecated: (item: LibraryPackage) => item.deprecated,
      itemRenderer,
      filterRenderer,
      defaultSearchOptions: { query: '', type: 'All', topic: 'All' },
    });
  }

  @postConstruct()
  protected override init(): void {
    super.init();
    this.toDispose.pushAll([
      this.notificationCenter.onLibraryDidInstall(() =>
        this.refresh(undefined)
      ),
      this.notificationCenter.onLibraryDidUninstall(() =>
        this.refresh(undefined)
      ),
    ]);
  }

  protected override async install({
    item,
    progressId,
    version,
  }: {
    item: LibraryPackage;
    progressId: string;
    version: Installable.Version;
  }): Promise<void> {
    const dependencies = await this.service.listDependencies({
      item,
      version,
      filterSelf: true,
    });
    let installDependencies: boolean | undefined = undefined;
    if (dependencies.length) {
      const message = document.createElement('div');
      message.innerHTML =
        dependencies.length === 1
          ? nls.localize(
              'arduino/library/needsOneDependency',
              'The library <b>{0}:{1}</b> needs another dependency currently not installed:',
              item.name,
              version
            )
          : nls.localize(
              'arduino/library/needsMultipleDependencies',
              'The library <b>{0}:{1}</b> needs some other dependencies currently not installed:',
              item.name,
              version
            );
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
      question.textContent =
        dependencies.length === 1
          ? nls.localize(
              'arduino/library/installOneMissingDependency',
              'Would you like to install the missing dependency?'
            )
          : nls.localize(
              'arduino/library/installMissingDependencies',
              'Would you like to install all the missing dependencies?'
            );
      message.appendChild(question);
      const result = await new MessageBoxDialog({
        title: nls.localize(
          'arduino/library/dependenciesForLibrary',
          'Dependencies for library {0}:{1}',
          item.name,
          version
        ),
        message,
        buttons: [
          nls.localize(
            'arduino/library/installWithoutDependencies',
            'Install without dependencies'
          ),
          nls.localize('arduino/library/installAll', 'Install all'),
        ],
        maxWidth: 740, // Aligned with `settings-dialog.css`.
      }).open();

      if (result) {
        const { response } = result;
        if (response === 1) {
          // Current only
          installDependencies = false;
        } else if (response === 2) {
          // All
          installDependencies = true;
        }
      }
    } else {
      // The lib does not have any dependencies.
      installDependencies = false;
    }

    if (typeof installDependencies === 'boolean') {
      await this.service.install({
        item,
        version,
        progressId,
        installDependencies,
      });
      this.messageService.info(
        nls.localize(
          'arduino/library/installedSuccessfully',
          'Successfully installed library {0}:{1}',
          item.name,
          version
        ),
        { timeout: 3000 }
      );
    }
  }

  protected override async uninstall({
    item,
    progressId,
  }: {
    item: LibraryPackage;
    progressId: string;
  }): Promise<void> {
    await super.uninstall({ item, progressId });
    this.messageService.info(
      nls.localize(
        'arduino/library/uninstalledSuccessfully',
        'Successfully uninstalled library {0}:{1}',
        item.name,
        item.installedVersion!
      ),
      { timeout: 3000 }
    );
  }
}

class MessageBoxDialog extends AbstractDialog<MessageBoxDialog.Result> {
  protected response: number;

  constructor(protected readonly options: MessageBoxDialog.Options) {
    super(options);
    this.contentNode.appendChild(this.createMessageNode(this.options.message));
    (
      options.buttons || [nls.localize('vscode/issueMainService/ok', 'OK')]
    ).forEach((text, index) => {
      const button = this.createButton(text);
      const isPrimaryButton =
        index === (options.buttons ? options.buttons.length - 1 : 0);
      button.classList.add(
        isPrimaryButton ? 'main' : 'secondary',
        'message-box-dialog-button'
      );
      this.controlPanel.appendChild(button);
      this.toDisposeOnDetach.push(
        addEventListener(button, 'click', () => {
          this.response = index;
          this.accept();
        })
      );
    });
  }

  protected override onCloseRequest(message: Message): void {
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

  protected override handleEnter(event: KeyboardEvent): boolean | void {
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
