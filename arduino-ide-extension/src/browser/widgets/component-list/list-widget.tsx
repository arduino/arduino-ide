import * as React from '@theia/core/shared/react';
import {
  injectable,
  postConstruct,
  inject,
} from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { Emitter } from '@theia/core/lib/common/event';
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

@injectable()
export abstract class ListWidget<
  T extends ArduinoComponent
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
  // protected readonly deferredContainer = new Deferred<HTMLElement>();
  protected readonly filterTextChangeEmitter = new Emitter<
    string | undefined
  >();
  /**
   * Instead of running an `update` from the `postConstruct` `init` method,
   * we use this variable to track first activate, then run.
   */
  protected firstActivate = true;

  constructor(protected options: ListWidget.Options<T>) {
    super();
    const { id, label, iconClass } = options;
    this.id = id;
    this.title.label = label;
    this.title.caption = label;
    this.title.iconClass = iconClass;
    this.title.closable = true;
    this.addClass('arduino-list-widget');
    this.node.tabIndex = 0; // To be able to set the focus on the widget.
    this.toDispose.push(this.filterTextChangeEmitter);
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.pushAll([
      this.notificationCenter.onIndexDidUpdate(() => this.refresh(undefined)),
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

  render(): React.ReactNode {
    return (
      <FilterableListContainer<T>
        container={this}
        resolveFocus={this.onFocusResolved}
        searchable={this.options.searchable}
        install={this.install.bind(this)}
        uninstall={this.uninstall.bind(this)}
        itemLabel={this.options.itemLabel}
        itemDeprecated={this.options.itemDeprecated}
        itemRenderer={this.options.itemRenderer}
        filterTextChangeEvent={this.filterTextChangeEmitter.event}
        messageService={this.messageService}
        commandService={this.commandService}
        responseService={this.responseService}
      />
    );
  }

  /**
   * If `filterText` is defined, sets the filter text to the argument.
   * If it is `undefined`, updates the view state by re-running the search with the current `filterText` term.
   */
  refresh(filterText: string | undefined): void {
    this.filterTextChangeEmitter.fire(filterText);
  }

  updateScrollBar(): void {
    if (this.scrollBar) {
      this.scrollBar.update();
    }
  }
}

export namespace ListWidget {
  export interface Options<T extends ArduinoComponent> {
    readonly id: string;
    readonly label: string;
    readonly iconClass: string;
    readonly installable: Installable<T>;
    readonly searchable: Searchable<T>;
    readonly itemLabel: (item: T) => string;
    readonly itemDeprecated: (item: T) => boolean;
    readonly itemRenderer: ListItemRenderer<T>;
  }
}
