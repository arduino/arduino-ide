import * as React from 'react';
import { FilterableListContainer } from '../components/component-list/filterable-list-container';
import { LibraryComponentList } from './library-component-list';

export class LibraryFilterableListContainer extends FilterableListContainer {

    constructor(props: Readonly<FilterableListContainer.Props>) {
        super(props);
        this.state = {
            filterText: '',
            items: [],
            props: {
                topic: this.topics[0],
                type: this.types[0]
            }
        };
    }

    protected renderSearchFilter(): React.ReactNode {
        const types = this.types.map(type => <option value={type} key={type}>{type}</option>);
        let type = this.types[0];
        if (this.state.props) {
            const currentType = this.types.find(t => t === this.state.props!.type) || this.types[0];
            if (currentType) {
                type = currentType;
            }
        }
        const topics = this.topics.map(topic => <option value={topic} key={topic}>{topic}</option>);
        let topic = this.topics[0];
        if (this.state.props) {
            const currentTopic = this.topics.find(t => t === this.state.props!.topic) || this.topics[0];
            if (currentTopic) {
                topic = currentTopic;
            }
        }
        return <div className={'search-filters'}>
            <div className={'filter'}>
                <div className={'title'} style={{ minWidth: '32.088px' }}>Type</div> {/** TODO: do `minWidth` better! */}
                <select
                    value={type}
                    onChange={this.onTypeChange}>
                    {types}
                </select>
            </div>
            <div className={'filter'}>
                <div className={'title'}>Topic</div>
                <select
                    value={topic}
                    onChange={this.onTopicChange}>
                    {topics}
                </select>
            </div>
        </div>
    }

    protected onTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const type = event.target.value;
        const props = { ...(this.state.props || {}), ...{ type } };
        this.setState({
            props
        });
    }

    protected onTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const topic = event.target.value;
        const props = { ...(this.state.props || {}), ...{ topic } };
        this.setState({
            props
        });
    }

    protected renderComponentList(): React.ReactNode {
        return <LibraryComponentList
            items={this.state.items}
            install={this.install.bind(this)}
            windowService={this.props.windowService}
            resolveContainer={this.props.resolveContainer}
        />
    }

    private get topics(): string[] {
        return [
            'All',
            'Communication',
            'Data Processing',
            'Data Storage',
            'Device Control',
            'Display',
            'Other',
            'Sensor',
            'Signal Input/Output',
            'Timing',
            'Uncategorized'
        ];
    }

    private get types(): string[] {
        return [
            'All',
            'Updatable',
            'Installed',
            'Arduino',
            'Partner',
            'Recommended',
            'Contributed',
            'Retired'
        ];
    }

}
