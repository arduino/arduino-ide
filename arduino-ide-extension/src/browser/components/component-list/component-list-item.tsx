import * as React from 'react';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentListItem<T> extends React.Component<ComponentListItem.Props<T>> {

    protected async install(item: T): Promise<void> {
        await this.props.install(item);
    }

    render(): React.ReactNode {
        const { item, itemRenderer, install } = this.props;
        return itemRenderer.renderItem(item, install.bind(this));
    }

}

export namespace ComponentListItem {

    export interface Props<T> {
        readonly item: T;
        readonly install: (item: T) => Promise<void>;
        readonly itemRenderer: ListItemRenderer<T>;
    }

}
