import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { Message } from '@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { FilterableListContainer } from '../components/component-list/filterable-list-container';
import { BoardsService } from '../../common/protocol/boards-service';

@injectable()
export abstract class ListWidget extends ReactWidget {

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    constructor() {
        super();
        const { id, title, iconClass } = this.widgetProps();
        this.id = id;
        this.title.label = title;
        this.title.caption = title;
        this.title.iconClass = iconClass;
        this.title.closable = true;
        this.addClass(ListWidget.Styles.LIST_WIDGET_CLASS);
        this.node.tabIndex = 0; // To be able to set the focus on the widget.
    }

    protected abstract widgetProps(): ListWidget.Props;

    @postConstruct()
    protected init(): void {
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
        this.render();
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.render();
    }

    render(): React.ReactNode {
        return <FilterableListContainer
            service={this.boardsService}
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

    export namespace Styles {
        export const LIST_WIDGET_CLASS = 'arduino-list-widget'
    }

}