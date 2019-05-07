import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ComponentList } from './component-list';
import { SearchBar } from './search-bar';
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
        return <div className={FilterableListContainer.Styles.FILTERABLE_LIST_CONTAINER_CLASS}>
            <SearchBar
                filterText={this.state.filterText}
                onFilterTextChanged={this.handleFilterTextChange}
            />
            <ComponentList
                items={this.state.items}
                install={this.install.bind(this)}
                windowService={this.props.windowService}
            />
        </div>
    }

    private handleFilterTextChange(filterText: string): void {
        this.props.service.search({ query: filterText }).then(result => {
            const { items } = result;
            this.setState({
                filterText,
                items: items.sort((a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    } else if (a.name === b.name) {
                        return 0;
                    } else {
                        return 1;
                    }
                })
            });
        });
    }

    protected async install(comp: ArduinoComponent): Promise<void> {
        const dialog = new InstallationProgressDialog(comp.name);
        dialog.open();
        try {
            await this.props.service.install(comp);
            const { items } = await this.props.service.search({ query: this.state.filterText });
            this.setState({ items });
        } finally {
            dialog.close();
        }
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
        install(board: ArduinoComponent): Promise<void>;
    }

}

