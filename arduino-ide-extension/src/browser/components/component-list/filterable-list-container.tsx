import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ComponentList } from './component-list';
import { SearchBar } from './search-bar';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';

export class FilterableListContainer extends React.Component<FilterableListContainer.Props, FilterableListContainer.State> {

    constructor(props: Readonly<FilterableListContainer.Props>) {
        super(props);
        this.state = {
            filterText: '',
            items: []
        };
        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    }

    componentWillMount(): void {
        this.handleFilterTextChange('');
    }

    render(): React.ReactNode {
        return <div className={FilterableListContainer.Styles.FILTERABLE_LIST_CONTAINER_CLASS}>
            <SearchBar
                filterText={this.state.filterText}
                onFilterTextChanged={this.handleFilterTextChange}
            />
            <ComponentList
                items={this.state.items}
                windowService={this.props.windowService}
            />
        </div>
    }

    private handleFilterTextChange(filterText: string): void {
        this.props.service.search({ query: filterText }).then(result => {
            const { items } = result;
            this.setState({
                filterText,
                items
            });
        });
    }

}

export namespace FilterableListContainer {

    export interface Props {
        readonly service: ComponentSource;
        readonly windowService: WindowService;
    }

    export interface State {
        filterText: string;
        items: ArduinoComponent[];
    }

    export namespace Styles {
        export const FILTERABLE_LIST_CONTAINER_CLASS = 'filterable-list-container';
    }

    export interface ComponentSource {
        search(req: { query: string }): Promise<{ items: ArduinoComponent[] }>
    }

}

