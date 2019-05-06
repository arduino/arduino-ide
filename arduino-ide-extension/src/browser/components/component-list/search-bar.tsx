import * as React from 'react';

export class SearchBar extends React.Component<SearchBar.Props> {

    constructor(props: Readonly<SearchBar.Props>) {
        super(props);
        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    }

    render(): React.ReactNode {
        return <form className={SearchBar.Styles.SEARCH_BAR_CLASS}>
            <input
                type='text'
                placeholder='Search'
                size={1}
                value={this.props.filterText}
                onChange={this.handleFilterTextChange}
            />
        </form>;
    }

    private handleFilterTextChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.props.onFilterTextChanged(event.target.value);
    }

}

export namespace SearchBar {

    export interface Props {
        filterText: string;
        onFilterTextChanged(filterText: string): void;
    }

    export namespace Styles {
        export const SEARCH_BAR_CLASS = 'search-bar';
    }

}
