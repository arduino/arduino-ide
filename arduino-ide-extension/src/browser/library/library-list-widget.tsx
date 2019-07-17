import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { Message } from '@phosphor/messaging';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { MaybePromise } from '@theia/core/lib/common/types';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { LibraryFilterableListContainer } from './library-filterable-list-container';
import { LibraryService } from '../../common/protocol/library-service';

@injectable()
export class LibraryListWidget extends ReactWidget {

    static WIDGET_ID = 'library-list-widget';
    static WIDGET_LABEL = 'Library Manager';

    @inject(LibraryService)
    protected readonly libraryService: LibraryService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    /**
     * Do not touch or use it. It is for setting the focus on the `input` after the widget activation.
     */
    protected focusNode: HTMLElement | undefined;
    protected readonly deferredContainer = new Deferred<HTMLElement>();

    constructor() {
        super();
        this.id = LibraryListWidget.WIDGET_ID
        this.title.label = LibraryListWidget.WIDGET_LABEL;
        this.title.caption = LibraryListWidget.WIDGET_LABEL
        this.title.iconClass = 'library-tab-icon';
        this.title.closable = true;
        this.addClass('arduino-list-widget');
        this.node.tabIndex = 0; // To be able to set the focus on the widget.
        this.scrollOptions = {
            suppressScrollX: true
        }
    }

    @postConstruct()
    protected init(): void {
        this.update();
    }

    protected getScrollContainer(): MaybePromise<HTMLElement> {
        return this.deferredContainer.promise;
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        (this.focusNode || this.node).focus();
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render();
    }

    protected onFocusResolved = (element: HTMLElement | undefined) => {
        this.focusNode = element;
    }

    render(): React.ReactNode {
        return <LibraryFilterableListContainer
            resolveContainer={this.deferredContainer.resolve}
            resolveFocus={this.onFocusResolved}
            service={this.libraryService}
            windowService={this.windowService}
        />;
    }

}

export namespace ListWidget {

    /**
     * Props for customizing the abstract list widget.
     */
    export interface Props {
        readonly id: string;
        readonly title: string;
        readonly iconClass: string;
    }

}
