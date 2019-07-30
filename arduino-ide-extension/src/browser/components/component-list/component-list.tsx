import * as React from 'react';
import { ComponentListItem } from './component-list-item';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentList<T> extends React.Component<ComponentList.Props<T>> {

    protected container?: HTMLElement;

    render(): React.ReactNode {
        return <div
            className={'items-container'}
            ref={this.setRef}>
            {this.props.items.map(item => this.createItem(item))}
        </div>;
    }

    componentDidMount(): void {
        if (this.container && this.props.resolveContainer) {
            this.props.resolveContainer(this.container);
        }
    }

    protected setRef = (element: HTMLElement | null) => {
        this.container = element || undefined;
    }

    protected createItem(item: T): React.ReactNode {
        return <ComponentListItem<T>
            key={this.props.itemLabel(item)}
            item={item}
            itemRenderer={this.props.itemRenderer}
            install={this.props.install} />
    }

}

export namespace ComponentList {

    export interface Props<T> {
        readonly items: T[];
        readonly itemLabel: (item: T) => string;
        readonly itemRenderer: ListItemRenderer<T>;
        readonly install: (item: T) => Promise<void>;
        readonly resolveContainer: (element: HTMLElement) => void;
    }

}
