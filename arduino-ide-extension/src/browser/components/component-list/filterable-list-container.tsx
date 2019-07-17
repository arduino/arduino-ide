import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { SearchBar } from './search-bar';
import { ComponentList } from './component-list';
import { LibraryService } from '../../../common/protocol/library-service';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { InstallationProgressDialog } from '../installation-progress-dialog';

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
        return <ComponentList
            items={this.state.items}
            install={this.install.bind(this)}
            windowService={this.props.windowService}
            resolveContainer={this.props.resolveContainer}
        />
    }

    private handleFilterTextChange(filterText: string): void {
        const { props } = this.state;
        this.props.service.search({ query: filterText, props }).then(result => {
            const { items } = result;
            this.setState({
                filterText,
                items: this.sort(items)
            });
        });
    }

    protected sort(items: ArduinoComponent[]): ArduinoComponent[] {
        return items.sort((left, right) => left.name.localeCompare(right.name));
    }

    protected async install(comp: ArduinoComponent): Promise<void> {
        const dialog = new InstallationProgressDialog(comp.name);
        dialog.open();
        try {
            await this.props.service.install(comp);
            const { props } = this.state;
            const { items } = await this.props.service.search({ query: this.state.filterText, props });
            this.setState({ items: this.sort(items) });
        } finally {
            dialog.close();
        }
    }

}

export namespace FilterableListContainer {

    export interface Props {
        readonly service: ComponentSource;
        readonly windowService: WindowService;
        readonly resolveContainer?: (element: HTMLElement) => void;
        readonly resolveFocus?: (element: HTMLElement | undefined) => void;
    }

    export interface State {
        filterText: string;
        items: ArduinoComponent[];
        props?: LibraryService.Search.Props;
    }

    export interface ComponentSource {
        search(req: { query: string, props?: LibraryService.Search.Props }): Promise<{ items: ArduinoComponent[] }>
        install(board: ArduinoComponent): Promise<void>;
    }

}

