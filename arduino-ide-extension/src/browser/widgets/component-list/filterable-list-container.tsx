import * as React from '@theia/core/shared/react';
import debounce from 'lodash.debounce';
import { Event } from '@theia/core/lib/common/event';
import { CommandService } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { Searchable } from '../../../common/protocol/searchable';
import { ExecuteWithProgress } from '../../../common/protocol/progressible';
import {
  Installable,
  libraryInstallFailed,
  platformInstallFailed,
} from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { SearchBar } from './search-bar';
import { ListWidget } from './list-widget';
import { ComponentList } from './component-list';
import { ListItemRenderer } from './list-item-renderer';
import {
  LibraryPackage,
  ResponseServiceClient,
} from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';
import { FilterRenderer } from './filter-renderer';
import { DisposableCollection } from '@theia/core/lib/common/disposable';

export class FilterableListContainer<
  T extends ArduinoComponent,
  S extends Searchable.Options
> extends React.Component<
  FilterableListContainer.Props<T, S>,
  FilterableListContainer.State<T, S>
> {
  private readonly toDispose: DisposableCollection;

  constructor(props: Readonly<FilterableListContainer.Props<T, S>>) {
    super(props);
    this.state = {
      searchOptions: props.defaultSearchOptions,
      items: [],
    };
    this.toDispose = new DisposableCollection();
  }

  override componentDidMount(): void {
    this.search = debounce(this.search, 500, { trailing: true });
    this.search(this.state.searchOptions);
    this.toDispose.pushAll([
      this.props.searchOptionsDidChange((newSearchOptions) => {
        const { searchOptions } = this.state;
        this.setSearchOptionsAndUpdate({
          ...searchOptions,
          ...newSearchOptions,
        });
      }),
      this.props.onDidShow(() => this.setState({ edited: undefined })),
    ]);
  }

  override componentDidUpdate(): void {
    // See: arduino/arduino-pro-ide#101
    // Resets the top of the perfect scroll-bar's thumb.
    this.props.container.updateScrollBar();
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  override render(): React.ReactNode {
    return (
      <div className={'filterable-list-container'}>
        {this.renderSearchBar()}
        {this.renderSearchFilter()}
        <div className="filterable-list-container">
          {this.renderComponentList()}
        </div>
      </div>
    );
  }

  protected renderSearchFilter(): React.ReactNode {
    return (
      <>
        {this.props.filterRenderer.render(
          this.state.searchOptions,
          this.handlePropChange.bind(this)
        )}
      </>
    );
  }

  protected renderSearchBar(): React.ReactNode {
    return (
      <SearchBar
        resolveFocus={this.props.resolveFocus}
        filterText={this.state.searchOptions.query ?? ''}
        onFilterTextChanged={(query) =>
          this.handlePropChange('query', query as S['query'])
        }
      />
    );
  }

  protected renderComponentList(): React.ReactNode {
    const { itemLabel, itemRenderer } = this.props;
    return (
      <ComponentList<T>
        items={this.state.items}
        itemLabel={itemLabel}
        itemRenderer={itemRenderer}
        install={this.install.bind(this)}
        uninstall={this.uninstall.bind(this)}
        edited={this.state.edited}
        onItemEdit={this.onItemEdit.bind(this)}
      />
    );
  }

  private handlePropChange = (prop: keyof S, value: S[keyof S]): void => {
    const searchOptions = {
      ...this.state.searchOptions,
      [prop]: value,
    };
    this.setSearchOptionsAndUpdate(searchOptions);
  };

  private setSearchOptionsAndUpdate(searchOptions: S) {
    this.setState({ searchOptions }, () => this.search(searchOptions));
  }

  private search(searchOptions: S): void {
    const { searchable } = this.props;
    searchable
      .search(searchOptions)
      .then((items) => this.setState({ items, edited: undefined }));
  }

  private async install(item: T, version: Installable.Version): Promise<void> {
    const { install, searchable, messageService } = this.props;
    const { name } = item;
    await ExecuteWithProgress.doWithProgress({
      ...this.props,
      progressText:
        nls.localize('arduino/common/processing', 'Processing') +
        ` ${name}:${version}`,
      run: async ({ progressId }) => {
        try {
          await install({ item, progressId, version });
        } catch (err) {
          const message = LibraryPackage.is(item) // TODO: this dispatch does not belong here
            ? libraryInstallFailed(name, version)
            : platformInstallFailed(name, version);
          const cause = err instanceof Error ? err.message : String(err);
          messageService.error(`${message} ${cause}`);
        }
      },
    });
    const items = await searchable.search(this.state.searchOptions);
    this.setState({ items, edited: undefined });
  }

  private async uninstall(item: T): Promise<void> {
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
    this.setState({ items, edited: undefined });
  }

  private onItemEdit(item: T, selectedVersion: Installable.Version): void {
    this.setState({ edited: { item, selectedVersion } });
  }
}

export namespace FilterableListContainer {
  export interface Props<
    T extends ArduinoComponent,
    S extends Searchable.Options
  > {
    readonly defaultSearchOptions: S;
    readonly container: ListWidget<T, S>;
    readonly searchable: Searchable<T, S>;
    readonly itemLabel: (item: T) => string;
    readonly itemRenderer: ListItemRenderer<T>;
    readonly filterRenderer: FilterRenderer<S>;
    readonly resolveFocus: (element: HTMLElement | undefined) => void;
    readonly searchOptionsDidChange: Event<Partial<S> | undefined>;
    readonly messageService: MessageService;
    readonly responseService: ResponseServiceClient;
    readonly onDidShow: Event<void>;
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
    edited?: {
      item: T;
      selectedVersion: Installable.Version;
    };
  }
}
