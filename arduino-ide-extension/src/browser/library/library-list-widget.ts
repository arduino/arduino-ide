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
import { findChildTheiaButton, splitByBoldTag } from '../utils/dom';
import { UserAbortError } from '../../common/protocol/progressible';

@injectable()
export class LibraryListWidget extends ListWidget<
  LibraryPackage,
  LibrarySearch
> {
  // 静态常量，用于设置小部件的标识符
  static WIDGET_ID = 'library-list-widget';
  // 静态常量，用于设置小部件的标签
  static WIDGET_LABEL = nls.localize(
    'arduino/library/title',
    'Library Manager'
  );

  constructor(
    // 注入 LibraryService
    @inject(LibraryService) private service: LibraryService,
    // 注入 ListItemRenderer
    @inject(ListItemRenderer) itemRenderer: ListItemRenderer<LibraryPackage>,
    // 注入 LibraryFilterRenderer
    @inject(LibraryFilterRenderer) filterRenderer: LibraryFilterRenderer
  ) {
    // 调用父类构造函数，配置 LibraryListWidget 的参数
    super({
      id: LibraryListWidget.WIDGET_ID,
      label: LibraryListWidget.WIDGET_LABEL,
      iconClass: 'fa lingzhi-libmager',
      searchable: service,
      installable: service,
      itemLabel: (item: LibraryPackage) => item.name,
      itemRenderer,
      filterRenderer,
      defaultSearchOptions: { query: '', type: 'All', topic: 'All' },
    });
  }

  // 在构造函数之后初始化的方法
  @postConstruct()
  protected override init(): void {
    super.init();
    // 订阅 LibraryDidInstall 和 LibraryDidUninstall 事件，当发生时刷新小部件
    this.toDispose.pushAll([
      this.notificationCenter.onLibraryDidInstall(() =>
        this.refresh(undefined)
      ),
      this.notificationCenter.onLibraryDidUninstall(() =>
        this.refresh(undefined)
      ),
    ]);
  }

  // 重写安装方法
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
      // 创建消息元素，用于提示用户安装依赖项
      const message = document.createElement('div');
      const textContent =
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
      const segments = splitByBoldTag(textContent);
      if (!segments) {
        message.textContent = textContent;
      } else {
        segments.map((segment) => {
          const span = document.createElement('span');
          if (typeof segment === 'string') {
            span.textContent = segment;
          } else {
            const bold = document.createElement('b');
            bold.textContent = segment.textContent;
            span.appendChild(bold);
          }
          message.appendChild(span);
        });
      }
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
      // 显示消息框对话框，让用户选择是否安装依赖项
      const result = await new MessageBoxDialog({
        title: nls.localize(
          'arduino/library/installLibraryDependencies',
          'Install library dependencies'
        ),
        message,
        buttons: [
          nls.localize(
            'arduino/library/installWithoutDependencies',
            'Install without dependencies'
          ),
          nls.localize('arduino/library/installAll', 'Install All'),
        ],
        maxWidth: 740, // Aligned with `settings-dialog.css`.
      }).open();

      if (result) {
        const { response } = result;
        if (response === 0) {
          // Current only
          installDependencies = false;
        } else if (response === 1) {
          // All
          installDependencies = true;
        }
      } else {
        // 用户取消操作，抛出 UserAbortError
        throw new UserAbortError();
      }
    } else {
      // 库没有任何依赖项
      installDependencies = false;
    }

    if (typeof installDependencies === 'boolean') {
      // 安装库及其依赖项（如果需要）
      await this.service.install({
        item,
        version,
        progressId,
        installDependencies,
      });
      // 显示安装成功的消息
      this.messageService.info(
        nls.localize(
          'arduino/library/installedSuccessfully',
          '成功安装库 {0}:{1}',
          item.name,
          version
        ),
        { timeout: 3000 }
      );
    }
  }

  // 重写卸载方法
  protected override async uninstall({
    item,
    progressId,
  }: {
    item: LibraryPackage;
    progressId: string;
  }): Promise<void> {
    await super.uninstall({ item, progressId });
    // 显示卸载成功的消息
    this.messageService.info(
      nls.localize(
        'arduino/library/uninstalledSuccessfully',
        '成功卸载库 {0}:{1}',
        item.name,
        item.installedVersion!
      ),
      { timeout: 3000 }
    );
  }
}

// MessageBoxDialog 类，用于显示消息框对话框
class MessageBoxDialog extends AbstractDialog<MessageBoxDialog.Result> {
  protected response: number;

  constructor(protected readonly options: MessageBoxDialog.Options) {
    super(options);
    // 在内容节点上添加消息元素
    this.contentNode.appendChild(this.createMessageNode(this.options.message));
    (
      options.buttons || [nls.localize('vscode/issueMainService/ok', '确定')]
    ).forEach((text, index) => {
      const button = this.createButton(text);
      const isPrimaryButton =
        index === (options.buttons ? options.buttons.length - 1 : 0);
      button.title = text;
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

  // 重写关闭请求处理方法
  protected override onCloseRequest(message: Message): void {
    super.onCloseRequest(message);
    this.accept();
  }

  // 获取对话框的结果
  get value(): MessageBoxDialog.Result {
    return { response: this.response };
  }

  // 创建消息节点的方法
  protected createMessageNode(message: string | HTMLElement): HTMLElement {
    if (typeof message === 'string') {
      const messageNode = document.createElement('div');
      messageNode.textContent = message;
      return messageNode;
    }
    return message;
  }

  // 重写处理回车键的方法
  protected override handleEnter(event: KeyboardEvent): boolean | void {
    this.response = 0;
    super.handleEnter(event);
  }

  // 重写附加后处理方法
  protected override onAfterAttach(message: Message): void {
    super.onAfterAttach(message);
    findChildTheiaButton(this.controlPanel)?.focus();
  }
}

// MessageBoxDialog 的命名空间
export namespace MessageBoxDialog {
  export interface Options extends DialogProps {
    /**
     * 当为空时，将推断为`['OK']`。
     */
    buttons?: string[];
    message: string | HTMLElement;
  }
  export interface Result {
    /**
     * 被点击的按钮在`buttons`数组中的索引。
     */
    readonly response: number;
  }
}
