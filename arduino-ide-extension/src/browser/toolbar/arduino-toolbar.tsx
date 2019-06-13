import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { TabBarToolbar, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

export class ArduinoToolbar extends Widget {

    protected toolbar: TabBarToolbar | undefined;

    constructor(
        protected readonly tabBarToolbarRegistry: TabBarToolbarRegistry,
        protected readonly tabBarToolbarFactory: () => TabBarToolbar
    ) {
        super();
        this.id = 'arduino-toolbar';
        this.init();
        this.tabBarToolbarRegistry.onDidChange(() => this.update());
    }

    protected onAfterAttach(msg: Message): void {
        if (this.toolbar) {
            if (this.toolbar.isAttached) {
                Widget.detach(this.toolbar);
            }
            Widget.attach(this.toolbar, this.node);
        }
        super.onAfterAttach(msg);
    }

    protected onBeforeDetach(msg: Message): void {
        if (this.toolbar && this.toolbar.isAttached) {
            Widget.detach(this.toolbar);
        }
        super.onBeforeDetach(msg);
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.updateToolbar();
    }

    protected updateToolbar(): void {
        if (!this.toolbar) {
            return;
        }
        const items = this ? this.tabBarToolbarRegistry.visibleItems(this) : [];
        this.toolbar.updateItems(items, this);
    }

    protected init(): void {
        this.node.classList.add('theia-arduino-toolbar');
        this.toolbar = this.tabBarToolbarFactory();
        this.update();
    }
}
