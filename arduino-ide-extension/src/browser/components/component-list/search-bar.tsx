import * as React from 'react';

export class SearchBar extends React.Component<SearchBar.Props> {

    constructor(props: Readonly<SearchBar.Props>) {
        super(props);
        this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    }

    render(): React.ReactNode {
        return <input
                ref={this.setRef}
                className={SearchBar.Styles.SEARCH_BAR_CLASS}
                type='text'
                placeholder='Filter your search...'
                size={1}
                value={this.props.filterText}
                onChange={this.handleFilterTextChange}
            />;
    }

    private setRef = (element: HTMLElement | null) => {
        if (this.props.resolveFocus) {
            this.props.resolveFocus(element || undefined);
        }
    }

    private handleFilterTextChange(event: React.ChangeEvent<HTMLInputElement>): void {
        this.props.onFilterTextChanged(event.target.value);
    }

}

export namespace SearchBar {

    export interface Props {
        filterText: string;
        onFilterTextChanged(filterText: string): void;
        readonly resolveFocus?: (element: HTMLElement | undefined) => void;
    }

    export namespace Styles {
        export const SEARCH_BAR_CLASS = 'search-bar';
    }

}
