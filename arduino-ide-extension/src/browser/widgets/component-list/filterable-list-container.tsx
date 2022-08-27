import * as React from '@theia/core/shared/react';
import debounce = require('lodash.debounce');
import { Event } from '@theia/core/lib/common/event';
import { CommandService } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { Searchable } from '../../../common/protocol/searchable';
import { ExecuteWithProgress } from '../../../common/protocol/progressible';
import { Installable } from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { SearchBar } from './search-bar';
import { ListWidget } from './list-widget';
import { ComponentList } from './component-list';
import { ListItemRenderer } from './list-item-renderer';
import { ResponseServiceClient } from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';

export class FilterableListContainer<
  T extends ArduinoComponent,
  S extends Searchable.Options
> extends React.Component<
  FilterableListContainer.Props<T, S>,
  FilterableListContainer.State<T, S>
> {
  constructor(props: Readonly<FilterableListContainer.Props<T, S>>) {
    super(props);
    this.state = {
      searchOptions: { query: '' } as S,
      items: [],
    };
  }

  override componentDidMount(): void {
    this.search = debounce(this.search, 500);
    this.handleQueryChange('');
    this.props.filterTextChangeEvent(this.handleQueryChange.bind(this));
  }

  override componentDidUpdate(): void {
    // See: arduino/arduino-pro-ide#101
    // Resets the top of the perfect scroll-bar's thumb.
    this.props.container.updateScrollBar();
  }

  override render(): React.ReactNode {
    return (
      <div className={'filterable-list-container'}>
        {this.renderSearchFilter()}
        {this.renderSearchBar()}
        {this.renderComponentList()}
      </div>
    );
  }

  protected renderSearchFilter(): React.ReactNode {
    return undefined;
  }

  protected renderSearchBar(): React.ReactNode {
    return (
      <SearchBar
        resolveFocus={this.props.resolveFocus}
        filterText={this.state.searchOptions.query ?? ''}
        onFilterTextChanged={this.handleQueryChange}
      />
    );
  }

  protected renderComponentList(): React.ReactNode {
    const { itemLabel, itemDeprecated, itemRenderer } = this.props;
    return (
      <ComponentList<T>
        items={this.state.items}
        itemLabel={itemLabel}
        itemDeprecated={itemDeprecated}
        itemRenderer={itemRenderer}
        install={this.install.bind(this)}
        uninstall={this.uninstall.bind(this)}
      />
    );
  }

  protected handleQueryChange = (
    query: string = this.state.searchOptions.query ?? ''
  ): void => {
    const newSearchOptions = {
      ...this.state.searchOptions,
      query,
    };
    this.setState({ searchOptions: newSearchOptions });
    this.search(newSearchOptions);
  };

  protected search(searchOptions: S): void {
    const { searchable } = this.props;
    searchable
      .search(searchOptions)
      .then((items) => this.setState({ items: this.sort(items) }));
  }

  protected sort(items: T[]): T[] {
    const { itemLabel, itemDeprecated } = this.props;
    return items.sort((left, right) => {
      // always put deprecated items at the bottom of the list
      if (itemDeprecated(left)) {
        return 1;
      }

      return itemLabel(left).localeCompare(itemLabel(right));
    });
  }

  protected async install(
    item: T,
    version: Installable.Version
  ): Promise<void> {
    const { install, searchable } = this.props;
    await ExecuteWithProgress.doWithProgress({
      ...this.props,
      progressText:
        nls.localize('arduino/common/processing', 'Processing') +
        ` ${item.name}:${version}`,
      run: ({ progressId }) => install({ item, progressId, version }),
    });
    const items = await searchable.search(this.state.searchOptions);
    this.setState({ items: this.sort(items) });
  }

  protected async uninstall(item: T): Promise<void> {
    const ok = await new ConfirmDialog({
      title: nls.localize('arduino/component/uninstall', 'Uninstall'),
      msg: nls.localize(
        'arduino/component/uninstallMsg',
        'Do you want to uninstall {0}?',
        item.name
      ),
      ok: nls.localize('vscode/extensionsUtils/yes', 'Yes'),
      cancel: nls.localize('vscode/extensionsUtils/no', 'No'),
    }).open();
    if (!ok) {
      return;
    }
    const { uninstall, searchable } = this.props;
    await ExecuteWithProgress.doWithProgress({
      ...this.props,
      progressText:
        nls.localize('arduino/common/processing', 'Processing') +
        ` ${item.name}${
          item.installedVersion ? `:${item.installedVersion}` : ''
        }`,
      run: ({ progressId }) => uninstall({ item, progressId }),
    });
    const items = await searchable.search(this.state.searchOptions);
    this.setState({ items: this.sort(items) });
  }
}

export namespace FilterableListContainer {
  export interface Props<
    T extends ArduinoComponent,
    S extends Searchable.Options
  > {
    readonly container: ListWidget<T, S>;
    readonly searchable: Searchable<T, S>;
    readonly itemLabel: (item: T) => string;
    readonly itemDeprecated: (item: T) => boolean;
    readonly itemRenderer: ListItemRenderer<T>;
    // readonly resolveContainer: (element: HTMLElement) => void;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
    readonly filterTextChangeEvent: Event<string | undefined>;
    readonly messageService: MessageService;
    readonly responseService: ResponseServiceClient;
    readonly install: ({
      item,
      progressId,
      version,
    }: {
      item: T;
      progressId: string;
      version: Installable.Version;
    }) => Promise<void>;
    readonly uninstall: ({
      item,
      progressId,
    }: {
      item: T;
      progressId: string;
    }) => Promise<void>;
    readonly commandService: CommandService;
  }

  export interface State<T, S extends Searchable.Options> {
    searchOptions: S;
    items: T[];
  }
}
