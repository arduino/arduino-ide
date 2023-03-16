import * as React from '@theia/core/shared/react';
import {
  injectable,
  postConstruct,
  inject,
} from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { Emitter, Event } from '@theia/core/lib/common/event';
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
import { StatefulWidget } from '@theia/core/lib/browser';
import { HoverService } from '../../theia/core/hover-service';

@injectable()
export abstract class ListWidget<
    T extends ArduinoComponent,
    S extends Searchable.Options
  >
  extends ReactWidget
  implements StatefulWidget
{
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;
  @inject(HoverService)
  private readonly hoverService: HoverService;

  /**
   * Do not touch or use it. It is for setting the focus on the `input` after the widget activation.
   */
  private focusNode: HTMLElement | undefined;
  private readonly didReceiveFirstFocus = new Deferred();
  private readonly searchOptions: ListWidgetSearchOptions<S>;
  private readonly onDidShowEmitter = new Emitter<void>();
  /**
   * Instead of running an `update` from the `postConstruct` `init` method,
   * we use this variable to track first activate, then run.
   */
  private firstUpdate = true;

  constructor(protected options: ListWidget.Options<T, S>) {
    super();
    const { id, label, iconClass, searchOptions } = options;
    this.id = id;
    this.title.label = label;
    this.title.caption = label;
    this.title.iconClass = iconClass;
    this.title.closable = true;
    this.addClass('arduino-list-widget');
    this.node.tabIndex = 0; // To be able to set the focus on the widget.
    this.scrollOptions = undefined;
    this.searchOptions = searchOptions;
    this.toDispose.push(this.onDidShowEmitter);
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

  storeState(): S | undefined {
    return this.searchOptions.options;
  }

  restoreState(oldState: unknown): void {
    if (oldState) {
      this.searchOptions.update(oldState as S);
    }
  }

  protected override onAfterShow(message: Message): void {
    this.maybeUpdateOnFirstRender();
    super.onAfterShow(message);
    this.onDidShowEmitter.fire();
  }

  private maybeUpdateOnFirstRender() {
    if (this.firstUpdate) {
      this.firstUpdate = false;
      this.update();
      this.didReceiveFirstFocus.promise.then(() => this.focusNode?.focus());
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

  private readonly onFocusResolved = (
    element: HTMLElement | undefined
  ): void => {
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

  override render(): React.ReactNode {
    return (
      <FilterableListContainer<T, S>
        searchOptions={this.searchOptions}
        container={this}
        resolveFocus={this.onFocusResolved}
        searchable={this.options.searchable}
        install={this.install.bind(this)}
        uninstall={this.uninstall.bind(this)}
        itemLabel={this.options.itemLabel}
        itemRenderer={this.options.itemRenderer}
        messageService={this.messageService}
        commandService={this.commandService}
        responseService={this.responseService}
        onDidShow={this.onDidShowEmitter.event}
        hoverService={this.hoverService}
      />
    );
  }

  /**
   * If `filterText` is defined, sets the filter text to the argument.
   * If it is `undefined`, updates the view state by re-running the search with the current `filterText` term.
   */
  refresh(searchOptions: Partial<S> | undefined): void {
    this.didReceiveFirstFocus.promise.then(() => {
      if (searchOptions) {
        this.searchOptions.update(searchOptions);
      } else {
        this.searchOptions.options = this.searchOptions.options; // triggers a refresh. TODO fix this!
      }
    });
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
    readonly itemRenderer: ListItemRenderer<T>;
    readonly searchOptions: ListWidgetSearchOptions<S>;
  }
}

export class UserAbortError extends Error {
  constructor(message = 'User abort') {
    super(message);
    Object.setPrototypeOf(this, UserAbortError.prototype);
  }
}

@injectable()
export abstract class ListWidgetSearchOptions<S extends Searchable.Options> {
  private readonly onDidChangeEmitter = new Emitter<Required<S>>();
  protected _options: Required<S>;

  @postConstruct()
  protected init(): void {
    this.options = this.defaultOptions;
  }

  get onDidChange(): Event<Required<S>> {
    return this.onDidChangeEmitter.event;
  }

  get options(): Required<S> {
    return this._options;
  }

  set options(options: Required<S>) {
    this._options = options;
    this.onDidChangeEmitter.fire({ ...this._options });
  }

  update(options: Partial<S>): void {
    this.options = { ...this.options, ...options };
  }

  clearFilters(): void {
    const { query } = this.options;
    this.options = { ...this.defaultOptions, query };
  }

  /**
   * `true` if all property values of the `options` object equals with the `defaultOptions` property values. The `query` property is ignored in the comparison.
   */
  hasFilters(): boolean {
    const defaultOptions = this.defaultOptions;
    const currentOptions = this.options;
    for (const key of Object.keys(currentOptions)) {
      if (key === 'query') {
        continue;
      }
      const defaultValue = (defaultOptions as Record<string, unknown>)[key];
      const currentValue = (currentOptions as Record<string, unknown>)[key];
      if (defaultValue !== currentValue) {
        return true;
      }
    }
    return false;
  }

  abstract get defaultOptions(): Required<S>;
}
