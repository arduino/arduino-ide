import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { TabBarDecorator } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { Title, Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardsListWidget } from '../../boards/boards-list-widget';
import {
  BoardsUpdates,
  LibraryUpdates,
} from '../../contributions/check-for-updates';
import { LibraryListWidget } from '../../library/library-list-widget';
import { NotificationCenter } from '../../notification-center';

@injectable()
abstract class ListWidgetTabBarDecorator
  implements TabBarDecorator, FrontendApplicationContribution
{
  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  private count = 0;
  private readonly onDidChangeDecorationsEmitter = new Emitter<void>();
  protected readonly toDispose = new DisposableCollection(
    this.onDidChangeDecorationsEmitter
  );

  abstract readonly id: string;
  readonly onDidChangeDecorations: Event<void> =
    this.onDidChangeDecorationsEmitter.event;

  onStop(): void {
    this.toDispose.dispose();
  }

  decorate(title: Title<Widget>): WidgetDecoration.Data[] {
    const { owner } = title;
    if (this.isListWidget(owner)) {
      if (this.count > 0) {
        return [{ badge: this.count }];
      }
    }
    return [];
  }

  protected async update(count: number): Promise<void> {
    this.count = count;
    this.onDidChangeDecorationsEmitter.fire();
  }

  protected abstract isListWidget(widget: Widget): boolean;

  protected abstract get updatableCount(): number | undefined;
}

@injectable()
export class LibraryListWidgetTabBarDecorator extends ListWidgetTabBarDecorator {
  @inject(LibraryUpdates)
  private readonly libraryUpdates: LibraryUpdates;

  readonly id = `${LibraryListWidget.WIDGET_ID}-badge-decorator`;

  onStart(): void {
    this.toDispose.push(
      this.libraryUpdates.onDidChange((libraries) =>
        this.update(libraries.length)
      )
    );
    const count = this.updatableCount;
    if (count) {
      this.update(count);
    }
  }

  protected isListWidget(widget: Widget): boolean {
    return widget instanceof LibraryListWidget;
  }

  protected get updatableCount(): number | undefined {
    return this.libraryUpdates.updates?.length;
  }
}

@injectable()
export class BoardsListWidgetTabBarDecorator extends ListWidgetTabBarDecorator {
  @inject(BoardsUpdates)
  private readonly boardsUpdates: BoardsUpdates;

  readonly id = `${BoardsListWidget.WIDGET_ID}-badge-decorator`;

  onStart(): void {
    this.toDispose.push(
      this.boardsUpdates.onDidChange((boards) => this.update(boards.length))
    );
    const count = this.updatableCount;
    if (count) {
      this.update(count);
    }
  }

  protected isListWidget(widget: Widget): boolean {
    return widget instanceof BoardsListWidget;
  }

  protected get updatableCount(): number | undefined {
    return this.boardsUpdates.updates?.length;
  }
}
