import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CoreService, IndexType, ResponseService } from '../../common/protocol';
import { NotificationCenter } from '../notification-center';
import { WindowServiceExt } from '../theia/core/window-service-ext';
import { Command, CommandRegistry, Contribution } from './contribution';

@injectable()
export class UpdateIndexes extends Contribution {
  @inject(WindowServiceExt)
  private readonly windowService: WindowServiceExt;
  @inject(LocalStorageService)
  private readonly localStorage: LocalStorageService;
  @inject(CoreService)
  private readonly coreService: CoreService;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(ResponseService)
  private readonly responseService: ResponseService;

  protected override init(): void {
    super.init();
    this.notificationCenter.onIndexUpdateDidComplete(({ summary }) =>
      Promise.all(
        Object.entries(summary).map(([type, updatedAt]) =>
          this.setLastUpdateDateTime(type as IndexType, updatedAt)
        )
      )
    );
  }

  override onReady(): void {
    this.checkForUpdates();
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(UpdateIndexes.Commands.UPDATE_INDEXES, {
      execute: () => this.updateIndexes(IndexType.All, true),
    });
    registry.registerCommand(UpdateIndexes.Commands.UPDATE_PLATFORM_INDEX, {
      execute: () => this.updateIndexes(['platform'], true),
    });
    registry.registerCommand(UpdateIndexes.Commands.UPDATE_LIBRARY_INDEX, {
      execute: () => this.updateIndexes(['library'], true),
    });
  }

  private async checkForUpdates(): Promise<void> {
    const checkForUpdates = this.preferences['arduino.checkForUpdates'];
    if (!checkForUpdates) {
      console.debug(
        '[update-indexes]: `arduino.checkForUpdates` is `false`. Skipping updating the indexes.'
      );
      return;
    }

    if (await this.windowService.isFirstWindow()) {
      const summary = await this.coreService.indexUpdateSummaryBeforeInit();
      if (summary.message) {
        // this.messageService.error(summary.message);
        const chunk = `${summary.message}`;
        this.responseService.appendToOutput({ chunk });
      }
      const typesToCheck = IndexType.All.filter((type) => !(type in summary));
      if (Object.keys(summary).length) {
        console.debug(
          `[update-indexes]: 在核心gRPC客户端初始化之前检测到索引更新摘要。更新本地存储 ${JSON.stringify(
            summary
          )}`
        );
      } else {
        console.debug(
          '[update-indexes]: No index update summary was available before the core gRPC client initialization. Checking the status of the all the index types.'
        );
      }
      await Promise.allSettled([
        ...Object.entries(summary).map(([type, updatedAt]) =>
          this.setLastUpdateDateTime(type as IndexType, updatedAt)
        ),
        this.updateIndexes(typesToCheck),
      ]);
    }
  }

  public async updateIndexes(types: IndexType[], force = false): Promise<void> {
    const updatedAt = new Date().toISOString();
    return Promise.all(
      types.map((type) => this.needsIndexUpdate(type, updatedAt, force))
    ).then((needsIndexUpdateResults) => {
      const typesToUpdate = needsIndexUpdateResults.filter(IndexType.is);
      if (typesToUpdate.length) {
        console.debug(
          `[update-indexes]: Requesting the index update of type: ${JSON.stringify(
            typesToUpdate
          )} with date time: ${updatedAt}.`
        );
        return this.coreService.updateIndex({ types: typesToUpdate });
      }
    });
  }

  private async needsIndexUpdate(
    type: IndexType,
    now: string,
    force = false
  ): Promise<IndexType | false> {
    if (force) {
      console.debug(
        `[update-indexes]: Update for index type: '${type}' was forcefully requested.`
      );
      return type;
    }
    const lastUpdateIsoDateTime = await this.getLastUpdateDateTime(type);
    if (!lastUpdateIsoDateTime) {
      console.debug(
        `[update-indexes]: No last update date time was persisted for index type: '${type}'. Index update is required.`
      );
      return type;
    }
    const lastUpdateDateTime = Date.parse(lastUpdateIsoDateTime);
    if (Number.isNaN(lastUpdateDateTime)) {
      console.debug(
        `[update-indexes]: Invalid last update date time was persisted for index type: '${type}'. Last update date time was: ${lastUpdateDateTime}. Index update is required.`
      );
      return type;
    }
    const diff = new Date(now).getTime() - lastUpdateDateTime;
    const needsIndexUpdate = diff >= this.threshold;
    console.debug(
      `[update-indexes]: Update for index type '${type}' is ${needsIndexUpdate ? '' : 'not '
      }required. Now: ${now}, Last index update date time: ${new Date(
        lastUpdateDateTime
      ).toISOString()}, diff: ${diff} ms, threshold: ${this.threshold} ms.`
    );
    return needsIndexUpdate ? type : false;
  }

  private async getLastUpdateDateTime(
    type: IndexType
  ): Promise<string | undefined> {
    const key = this.storageKeyOf(type);
    return this.localStorage.getData<string>(key);
  }

  private async setLastUpdateDateTime(
    type: IndexType,
    updatedAt: string
  ): Promise<void> {
    const key = this.storageKeyOf(type);
    return this.localStorage.setData<string>(key, updatedAt).finally(() => {
      console.debug(
        `[update-indexes]: Updated the last index update date time of '${type}' to ${updatedAt}.`
      );
    });
  }

  private storageKeyOf(type: IndexType): string {
    return `index-last-update-time--${type}`;
  }

  private get threshold(): number {
    return 4 * 60 * 60 * 1_000; // four hours in millis
  }
}
export namespace UpdateIndexes {
  export namespace Commands {
    export const UPDATE_INDEXES: Command & { label: string } = {
      id: 'lingzhi-update-indexes',
      label: nls.localize(
        'arduino/updateIndexes/updateIndexes',
        'Update Indexes'
      ),
      category: 'LingZhi',
    };
    export const UPDATE_PLATFORM_INDEX: Command & { label: string } = {
      id: 'lingzhi-update-package-index',
      label: nls.localize(
        'arduino/updateIndexes/updatePackageIndex',
        'Update Package Index'
      ),
      category: 'LingZhi',
    };
    export const UPDATE_LIBRARY_INDEX: Command & { label: string } = {
      id: 'lingzhi-update-library-index',
      label: nls.localize(
        'arduino/updateIndexes/updateLibraryIndex',
        'Update Library Index'
      ),
      category: 'LingZhi',
    };
  }
}
