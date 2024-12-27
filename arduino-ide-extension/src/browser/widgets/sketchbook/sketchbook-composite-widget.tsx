import React from '@theia/core/shared/react';
import { createRoot, Root } from '@theia/core/shared/react-dom/client';
import { inject, injectable } from '@theia/core/shared/inversify';
import { nls } from '@theia/core/lib/common/nls';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message, MessageLoop } from '@theia/core/shared/@phosphor/messaging';
import { Disposable } from '@theia/core/lib/common/disposable';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { CommandService } from '@theia/core/lib/common/command';
import { SketchbookTreeWidget } from './sketchbook-tree-widget';
import { CreateNew } from '../sketchbook/create-new';
import { findChildTheiaButton } from '../../utils/dom';

// 使用 injectable 装饰器标记这个类可以被注入
@injectable()
export abstract class BaseSketchbookCompositeWidget<
  TW extends SketchbookTreeWidget
> extends BaseWidget {
  // 使用 inject 装饰器注入 CommandService
  @inject(CommandService)
  protected readonly commandService: CommandService;

  private readonly compositeNode: HTMLElement;
  private readonly footerNode: HTMLElement;
  private readonly footerRoot: Root;

  constructor() {
    super();
    // 创建一个 div 元素作为复合节点
    this.compositeNode = document.createElement('div');
    this.compositeNode.classList.add('composite-node');
    // 创建一个 div 元素作为页脚节点
    this.footerNode = document.createElement('div');
    this.footerNode.classList.add('footer-node');
    // 将页脚节点添加到复合节点中
    this.compositeNode.appendChild(this.footerNode);
    // 创建 React 的根节点，用于渲染页脚内容
    this.footerRoot = createRoot(this.footerNode);
    // 将复合节点添加到当前小部件的节点中
    this.node.appendChild(this.compositeNode);
    // 设置小部件标题不可关闭
    this.title.closable = false;
  }

  // 抽象方法，用于获取树状小部件实例
  abstract get treeWidget(): TW;

  // 抽象方法，用于渲染页脚内容
  protected abstract renderFooter(footerRoot: Root): void;

  // 更新页脚的方法，调用渲染页脚的方法
  protected updateFooter(): void {
    this.renderFooter(this.footerRoot);
  }

  // 重写小部件附加后的处理方法
  protected override onAfterAttach(message: Message): void {
    super.onAfterAttach(message);
    // 将树状小部件附加到复合节点上
    Widget.attach(this.treeWidget, this.compositeNode);
    // 渲染页脚内容
    this.renderFooter(this.footerRoot);
    // 添加一个在小部件分离时执行的处理函数，用于分离树状小部件
    this.toDisposeOnDetach.push(
      Disposable.create(() => Widget.detach(this.treeWidget))
    );
  }

  // 重写小部件激活请求的处理方法
  protected override onActivateRequest(message: Message): void {
    super.onActivateRequest(message);
    // 如果不发送这个调整大小的消息，树状小部件可能会渲染为空，所以发送未知大小的调整大小消息
    this.onResize(Widget.ResizeMessage.UnknownSize);
    // 查找页脚节点中的 Theia 按钮并聚焦（如果存在）
    findChildTheiaButton(this.footerNode, true)?.focus();
  }

  // 重写小部件调整大小的处理方法
  protected override onResize(message: Widget.ResizeMessage): void {
    super.onResize(message);
    // 将未知大小的调整大小消息发送给树状小部件
    MessageLoop.sendMessage(this.treeWidget, Widget.ResizeMessage.UnknownSize);
  }
}

// 使用 injectable 装饰器标记这个类可以被注入
@injectable()
export class SketchbookCompositeWidget extends BaseSketchbookCompositeWidget<SketchbookTreeWidget> {
  // 使用 inject 装饰器注入 SketchbookTreeWidget
  @inject(SketchbookTreeWidget)
  private readonly sketchbookTreeWidget: SketchbookTreeWidget;

  constructor() {
    super();
    // 设置小部件的 ID
    this.id = 'sketchbook-composite-widget';
    // 设置小部件标题的文本
    this.title.caption = nls.localize(
      'arduino/sketch/titleLocalSketchbook',
      'Local Sketchbook'
    );
    // 设置小部件标题的图标类名
    this.title.iconClass = 'sketchbook-tree-icon';
  }

  // 获取树状小部件实例
  get treeWidget(): SketchbookTreeWidget {
    return this.sketchbookTreeWidget;
  }

  // 渲染页脚内容，使用 CreateNew 组件并传入标签和点击处理函数
  protected renderFooter(footerRoot: Root): void {
    footerRoot.render(
      <CreateNew label={'新建项目'} onClick={this.onDidClickCreateNew} />
    );
  }

  // 点击创建新内容的处理函数，执行命令以创建新的草图
  private onDidClickCreateNew: () => void = () => {
    this.commandService.executeCommand('lingzhi-new-sketch');
  };
}
