import { inject, injectable, postConstruct } from 'inversify';
import { toArray } from '@phosphor/algorithm';
import { IDragEvent } from '@phosphor/dragdrop';
import { DockPanel, Widget } from '@phosphor/widgets';
import { Message, MessageLoop } from '@phosphor/messaging';
import { Disposable } from '@theia/core/lib/common/disposable';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { SketchbookTreeWidget } from './sketchbook-tree-widget';

@injectable()
export class SketchbookWidget extends BaseWidget {

    @inject(SketchbookTreeWidget)
    protected readonly localSketchbookTreeWidget: SketchbookTreeWidget;

    protected readonly sketchbookTreesContainer: DockPanel;

    constructor() {
        super();
        this.id = 'arduino-sketchbook-widget';
        this.title.caption = 'Sketchbook';
        this.title.label = 'Sketchbook';
        this.title.iconClass = 'sketchbook-tab-icon';
        this.title.closable = true;
        this.node.tabIndex = 0;
        this.sketchbookTreesContainer = this.createTreesContainer();
    }

    @postConstruct()
    protected init(): void {
        this.sketchbookTreesContainer.addWidget(this.localSketchbookTreeWidget);
    }

    protected onAfterAttach(message: Message): void {
        super.onAfterAttach(message);
        Widget.attach(this.sketchbookTreesContainer, this.node);
        this.toDisposeOnDetach.push(Disposable.create(() => Widget.detach(this.sketchbookTreesContainer)));
    }

    protected onActivateRequest(message: Message): void {
        super.onActivateRequest(message);

        // TODO: focus the active sketchbook
        // if (this.editor) {
        //     this.editor.focus();
        // } else {
        // }
        this.node.focus();
    }

    protected onResize(message: Widget.ResizeMessage): void {
        super.onResize(message);
        MessageLoop.sendMessage(this.sketchbookTreesContainer, Widget.ResizeMessage.UnknownSize);
        for (const widget of toArray(this.sketchbookTreesContainer.widgets())) {
            MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
        }
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.onResize(Widget.ResizeMessage.UnknownSize);
    }

    protected createTreesContainer(): DockPanel {
        const panel = new NoopDragOverDockPanel({ spacing: 0, mode: 'single-document' });
        panel.addClass('sketchbook-trees-container');
        panel.node.tabIndex = -1;
        return panel;
    }

}

export class NoopDragOverDockPanel extends DockPanel {

    constructor(options?: DockPanel.IOptions) {
        super(options);
        NoopDragOverDockPanel.prototype['_evtDragOver'] = (event: IDragEvent) => {
            event.preventDefault();
            event.stopPropagation();
            event.dropAction = 'none';
        };
    }

}

