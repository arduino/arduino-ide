import { nls } from '@theia/core/lib/common';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import {
  BoardSearch,
  BoardsPackage,
  BoardsService,
} from '../../common/protocol/boards-service';
import { ListItemRenderer } from '../widgets/component-list/list-item-renderer';
import {
  ListWidget,
  ListWidgetSearchOptions,
} from '../widgets/component-list/list-widget';

@injectable()
export class BoardsListWidgetSearchOptions extends ListWidgetSearchOptions<BoardSearch> {
  get defaultOptions(): Required<BoardSearch> {
    return { query: '', type: 'All' };
  }
}

@injectable()
export class BoardsListWidget extends ListWidget<BoardsPackage, BoardSearch> {
  static WIDGET_ID = 'boards-list-widget';
  static WIDGET_LABEL = nls.localize('arduino/boardsManager', 'Boards Manager');

  constructor(
    @inject(BoardsService) service: BoardsService,
    @inject(ListItemRenderer) itemRenderer: ListItemRenderer<BoardsPackage>,
    @inject(BoardsListWidgetSearchOptions)
    searchOptions: BoardsListWidgetSearchOptions
  ) {
    super({
      id: BoardsListWidget.WIDGET_ID,
      label: BoardsListWidget.WIDGET_LABEL,
      iconClass: 'fa fa-arduino-boards',
      searchable: service,
      installable: service,
      itemLabel: (item: BoardsPackage) => item.name,
      itemRenderer,
      searchOptions,
    });
  }

  @postConstruct()
  protected override init(): void {
    super.init();
    this.toDispose.pushAll([
      this.notificationCenter.onPlatformDidInstall(() =>
        this.refresh(undefined)
      ),
      this.notificationCenter.onPlatformDidUninstall(() =>
        this.refresh(undefined)
      ),
    ]);
  }

  protected override async install({
    item,
    progressId,
    version,
  }: {
    item: BoardsPackage;
    progressId: string;
    version: string;
  }): Promise<void> {
    await super.install({ item, progressId, version });
    this.messageService.info(
      nls.localize(
        'arduino/board/succesfullyInstalledPlatform',
        'Successfully installed platform {0}:{1}',
        item.name,
        version
      ),
      { timeout: 3000 }
    );
  }

  protected override async uninstall({
    item,
    progressId,
  }: {
    item: BoardsPackage;
    progressId: string;
  }): Promise<void> {
    await super.uninstall({ item, progressId });
    this.messageService.info(
      nls.localize(
        'arduino/board/succesfullyUninstalledPlatform',
        'Successfully uninstalled platform {0}:{1}',
        item.name,
        item.installedVersion!
      ),
      { timeout: 3000 }
    );
  }
}
