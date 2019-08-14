import * as React from 'react';
import debounce = require('lodash.debounce');
import { Searchable } from '../../../common/protocol/searchable';
import { Installable } from '../../../common/protocol/installable';
import { InstallationProgressDialog } from '../installation-progress-dialog';
import { SearchBar } from './search-bar';
import { ComponentList } from './component-list';
import { ListItemRenderer } from './list-item-renderer';

export class FilterableListContainer<T> extends React.Component<FilterableListContainer.Props<T>, FilterableListContainer.State<T>> {

    constructor(props: Readonly<FilterableListContainer.Props<T>>) {
        super(props);
        this.state = {
            filterText: '',
            items: []
        };
    }

    componentWillMount(): void {
        this.search = debounce(this.search, 500);
        this.handleFilterTextChange('');
    }

    render(): React.ReactNode {
        return <div className={'filterable-list-container'}>
            {this.renderSearchFilter()}
            {this.renderSearchBar()}
            {this.renderComponentList()}
        </div>
    }

    protected renderSearchFilter(): React.ReactNode {
        return undefined;
    }

    protected renderSearchBar(): React.ReactNode {
        return <SearchBar
            resolveFocus={this.props.resolveFocus}
            filterText={this.state.filterText}
            onFilterTextChanged={this.handleFilterTextChange}
        />
    }

    protected renderComponentList(): React.ReactNode {
        const { itemLabel, resolveContainer, itemRenderer } = this.props;
        return <ComponentList<T>
            items={this.state.items}
            itemLabel={itemLabel}
            itemRenderer={itemRenderer}
            install={this.install.bind(this)}
            resolveContainer={resolveContainer}
        />
    }

    protected handleFilterTextChange = (filterText: string) => {
        this.setState({ filterText });
        this.search(filterText);
    }
    
    protected search (query: string): void {
        const { searchable } = this.props;
        searchable.search({ query: query.trim() }).then(result => {
            const { items } = result;
            this.setState({
                items: this.sort(items)
            });
        });
    }

    protected sort(items: T[]): T[] {
        const { itemLabel } = this.props;
        return items.sort((left, right) => itemLabel(left).localeCompare(itemLabel(right)));
    }

    protected async install(item: T): Promise<void> {
        const { installable, searchable, itemLabel } = this.props;
        const dialog = new InstallationProgressDialog(itemLabel(item));
        dialog.open();
        try {
            await installable.install(item);
            const { items } = await searchable.search({ query: this.state.filterText });
            this.setState({ items: this.sort(items) });
        } finally {
            dialog.close();
        }
    }

}

export namespace FilterableListContainer {

    export interface Props<T> {
        readonly installable: Installable<T>;
        readonly searchable: Searchable<T>;
        readonly itemLabel: (item: T) => string;
        readonly itemRenderer: ListItemRenderer<T>;
        readonly resolveContainer: (element: HTMLElement) => void;
        readonly resolveFocus: (element: HTMLElement | undefined) => void;
    }

    export interface State<T> {
        filterText: string;
        items: T[];
    }

}
