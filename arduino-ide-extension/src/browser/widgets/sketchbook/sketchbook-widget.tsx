import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import { IDragEvent } from '@theia/core/shared/@phosphor/dragdrop';
import { DockPanel, Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message, MessageLoop } from '@theia/core/shared/@phosphor/messaging';
import { Disposable } from '@theia/core/lib/common/disposable';
import { BaseWidget, Title } from '@theia/core/lib/browser/widgets/widget';
import { SketchbookTreeWidget } from './sketchbook-tree-widget';
import { nls } from '@theia/core/lib/common/nls';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { CloudSketchbookCompositeWidget } from '../cloud-sketchbook/cloud-sketchbook-composite-widget';
import { URI } from '../../contributions/contribution';
import { TheiaDockPanel } from '@theia/core/lib/browser/shell/theia-dock-panel';

@injectable()
export class SketchbookWidget extends BaseWidget {
  static LABEL = nls.localize('arduino/sketch/titleSketchbook', 'Sketchbook');

  @inject(SketchbookTreeWidget)
  protected readonly localSketchbookTreeWidget: SketchbookTreeWidget;

  protected readonly sketchbookTreesContainer: NoopDragOverDockPanel;
  private readonly onCurrentTreeDidChangeEmitter: Emitter<Widget | undefined>;

  constructor() {
    super();
    this.id = 'arduino-sketchbook-widget';
    this.title.caption = SketchbookWidget.LABEL;
    this.title.label = SketchbookWidget.LABEL;
    this.title.iconClass = 'fa fa-arduino-folder';
    this.title.closable = true;
    this.node.tabIndex = 0;
    this.sketchbookTreesContainer = this.createTreesContainer();
    this.onCurrentTreeDidChangeEmitter = new Emitter<Widget | undefined>();
    this.toDispose.pushAll([
      this.onCurrentTreeDidChangeEmitter,
      this.sketchbookTreesContainer.onCurrentDidChange((title) =>
        this.onCurrentTreeDidChangeEmitter.fire(
          title?.owner instanceof SketchbookTreeWidget ? title.owner : undefined
        )
      ),
    ]);
  }

  @postConstruct()
  protected init(): void {
    this.sketchbookTreesContainer.addWidget(this.localSketchbookTreeWidget);
  }

  protected override onAfterAttach(message: Message): void {
    super.onAfterAttach(message);
    Widget.attach(this.sketchbookTreesContainer, this.node);
    this.toDisposeOnDetach.push(
      Disposable.create(() => Widget.detach(this.sketchbookTreesContainer))
    );
  }

  get onCurrentTreeDidChange(): Event<Widget | undefined> {
    return this.onCurrentTreeDidChangeEmitter.event;
  }

  getTreeWidget(): SketchbookTreeWidget {
    return this.localSketchbookTreeWidget;
  }

  activeTreeWidgetId(): string | undefined {
    const selectedTreeWidgets = toArray(
      this.sketchbookTreesContainer.selectedWidgets()
    ).map(({ id }) => id);
    if (selectedTreeWidgets.length > 1) {
      console.warn(
        `Found multiple selected tree widgets: ${JSON.stringify(
          selectedTreeWidgets
        )}. Expected only one.`
      );
    }
    return selectedTreeWidgets.shift();
  }

  async revealSketchNode(treeWidgetId: string, nodeUri: string): Promise<void> {
    const widget = toArray(this.sketchbookTreesContainer.widgets())
      .filter(({ id }) => id === treeWidgetId)
      .shift();
    if (!widget) {
      console.warn(`Could not find tree widget with ID: ${widget}`);
      return;
    }
    // TODO: remove this when the remote/local sketchbooks and their widgets are cleaned up.
    const findTreeWidget = (
      widget: Widget | undefined
    ): SketchbookTreeWidget | undefined => {
      if (widget instanceof SketchbookTreeWidget) {
        return widget;
      }
      if (widget instanceof CloudSketchbookCompositeWidget) {
        return widget.getTreeWidget();
      }
      return undefined;
    };
    const treeWidget = findTreeWidget(
      toArray(this.sketchbookTreesContainer.widgets())
        .filter(({ id }) => id === treeWidgetId)
        .shift()
    );
    if (!treeWidget) {
      console.warn(`Could not find tree widget with ID: ${treeWidget}`);
      return;
    }
    this.sketchbookTreesContainer.activateWidget(widget);

    const treeNode = await treeWidget.model.revealFile(new URI(nodeUri));
    if (!treeNode) {
      console.warn(`Could not find tree node with URI: ${nodeUri}`);
    }
  }

  protected override onActivateRequest(message: Message): void {
    super.onActivateRequest(message);

    // TODO: focus the active sketchbook
    // if (this.editor) {
    //     this.editor.focus();
    // } else {
    // }
    this.node.focus();
  }

  protected override onResize(message: Widget.ResizeMessage): void {
    super.onResize(message);
    MessageLoop.sendMessage(
      this.sketchbookTreesContainer,
      Widget.ResizeMessage.UnknownSize
    );
    for (const widget of toArray(this.sketchbookTreesContainer.widgets())) {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    }
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.onResize(Widget.ResizeMessage.UnknownSize);
  }

  protected createTreesContainer(): NoopDragOverDockPanel {
    const panel = new NoopDragOverDockPanel({
      spacing: 0,
      mode: 'single-document',
    });
    panel.addClass('sketchbook-trees-container');
    panel.node.tabIndex = -1;
    return panel;
  }
}

class NoopDragOverDockPanel extends TheiaDockPanel {
  private readonly onCurrentDidChangeEmitter = new Emitter<
    Title<Widget> | undefined
  >();
  readonly onCurrentDidChange = this.onCurrentDidChangeEmitter.event;

  constructor(options?: DockPanel.IOptions) {
    super(options);
    super['_evtDragOver'] = (event: IDragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.dropAction = 'none';
    };
  }

  override markAsCurrent(title: Title<Widget> | undefined): void {
    super.markAsCurrent(title);
    this.onCurrentDidChangeEmitter.fire(title);
  }

  override dispose(): void {
    super.dispose();
    this.onCurrentDidChangeEmitter.dispose();
  }
}
