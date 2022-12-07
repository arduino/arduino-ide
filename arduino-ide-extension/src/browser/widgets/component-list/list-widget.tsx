import * as React from '@theia/core/shared/react';
import {
  injectable,
  postConstruct,
  inject,
} from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { Emitter } from '@theia/core/lib/common/event';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { CommandService } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import {
  Installable,
  Searchable,
  ArduinoComponent,
  ResponseServiceClient,
} from '../../../common/protocol';
import { FilterableListContainer } from './filterable-list-container';
import { ListItemRenderer } from './list-item-renderer';
import { NotificationCenter } from '../../notification-center';
import { FilterRenderer } from './filter-renderer';

@injectable()
export abstract class ListWidget<
  T extends ArduinoComponent,
  S extends Searchable.Options
> extends ReactWidget {
  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(CommandService)
  protected readonly commandService: CommandService;

  @inject(ResponseServiceClient)
  protected readonly responseService: ResponseServiceClient;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  /**
   * Do not touch or use it. It is for setting the focus on the `input` after the widget activation.
   */
  protected focusNode: HTMLElement | undefined;
  private readonly didReceiveFirstFocus = new Deferred();
  protected readonly searchOptionsChangeEmitter = new Emitter<
    Partial<S> | undefined
  >();
  /**
   * Instead of running an `update` from the `postConstruct` `init` method,
   * we use this variable to track first activate, then run.
   */
  protected firstActivate = true;

  protected readonly defaultSortComparator: (left: T, right: T) => number;

  constructor(protected options: ListWidget.Options<T, S>) {
    super();
    const { id, label, iconClass, itemDeprecated, itemLabel } = options;
    this.id = id;
    this.title.label = label;
    this.title.caption = label;
    this.title.iconClass = iconClass;
    this.title.closable = true;
    this.addClass('arduino-list-widget');
    this.node.tabIndex = 0; // To be able to set the focus on the widget.
    this.scrollOptions = undefined;
    this.toDispose.push(this.searchOptionsChangeEmitter);

    this.defaultSortComparator = (left, right): number => {
      // always put deprecated items at the bottom of the list
      if (itemDeprecated(left)) {
        return 1;
      }

      return itemLabel(left).localeCompare(itemLabel(right));
    };
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.pushAll([
      this.notificationCenter.onIndexUpdateDidComplete(() =>
        this.refresh(undefined)
      ),
      this.notificationCenter.onDaemonDidStart(() => this.refresh(undefined)),
      this.notificationCenter.onDaemonDidStop(() => this.refresh(undefined)),
    ]);
  }

  protected override onAfterShow(message: Message): void {
    this.maybeUpdateOnFirstRender();
    super.onAfterShow(message);
  }

  private maybeUpdateOnFirstRender() {
    if (this.firstActivate) {
      this.firstActivate = false;
      this.update();
    }
  }

  protected override onActivateRequest(message: Message): void {
    this.maybeUpdateOnFirstRender();
    super.onActivateRequest(message);
    (this.focusNode || this.node).focus();
  }

  protected override onUpdateRequest(message: Message): void {
    super.onUpdateRequest(message);
    this.render();
  }

  protected override onResize(message: Widget.ResizeMessage): void {
    super.onResize(message);
    this.updateScrollBar();
  }

  protected onFocusResolved = (element: HTMLElement | undefined): void => {
    this.focusNode = element;
    this.didReceiveFirstFocus.resolve();
  };

  protected async install({
    item,
    progressId,
    version,
  }: {
    item: T;
    progressId: string;
    version: Installable.Version;
  }): Promise<void> {
    return this.options.installable.install({ item, progressId, version });
  }

  protected async uninstall({
    item,
    progressId,
  }: {
    item: T;
    progressId: string;
  }): Promise<void> {
    return this.options.installable.uninstall({ item, progressId });
  }

  protected filterableListSort = (items: T[]): T[] => {
    const isArduinoTypeComparator = (left: T, right: T) => {
      const aIsArduinoType = left.types.includes('Arduino');
      const bIsArduinoType = right.types.includes('Arduino');

      if (aIsArduinoType && !bIsArduinoType && !left.deprecated) {
        return -1;
      }

      if (!aIsArduinoType && bIsArduinoType && !right.deprecated) {
        return 1;
      }

      return 0;
    };

    return items.sort((left, right) => {
      return (
        isArduinoTypeComparator(left, right) ||
        this.defaultSortComparator(left, right)
      );
    });
  };

  render(): React.ReactNode {
    return (
      <FilterableListContainer<T, S>
        defaultSearchOptions={this.options.defaultSearchOptions}
        container={this}
        resolveFocus={this.onFocusResolved}
        searchable={this.options.searchable}
        install={this.install.bind(this)}
        uninstall={this.uninstall.bind(this)}
        itemLabel={this.options.itemLabel}
        itemDeprecated={this.options.itemDeprecated}
        itemRenderer={this.options.itemRenderer}
        filterRenderer={this.options.filterRenderer}
        searchOptionsDidChange={this.searchOptionsChangeEmitter.event}
        messageService={this.messageService}
        commandService={this.commandService}
        responseService={this.responseService}
        sort={this.filterableListSort}
      />
    );
  }

  /**
   * If `filterText` is defined, sets the filter text to the argument.
   * If it is `undefined`, updates the view state by re-running the search with the current `filterText` term.
   */
  refresh(searchOptions: Partial<S> | undefined): void {
    this.didReceiveFirstFocus.promise.then(() =>
      this.searchOptionsChangeEmitter.fire(searchOptions)
    );
  }

  updateScrollBar(): void {
    if (this.scrollBar) {
      this.scrollBar.update();
    }
  }
}

export namespace ListWidget {
  export interface Options<
    T extends ArduinoComponent,
    S extends Searchable.Options
  > {
    readonly id: string;
    readonly label: string;
    readonly iconClass: string;
    readonly installable: Installable<T>;
    readonly searchable: Searchable<T, S>;
    readonly itemLabel: (item: T) => string;
    readonly itemDeprecated: (item: T) => boolean;
    readonly itemRenderer: ListItemRenderer<T>;
    readonly filterRenderer: FilterRenderer<S>;
    readonly defaultSearchOptions: S;
  }
}
