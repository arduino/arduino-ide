import { injectable, inject, named } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { Event, Emitter } from '@theia/core/lib/common/event';
import {
  FrontendApplicationContribution,
  LocalStorageService,
} from '@theia/core/lib/browser';
import { notEmpty } from '../../common/utils';
import {
  BoardsService,
  ConfigOption,
  BoardDetails,
  Programmer,
} from '../../common/protocol';
import { NotificationCenter } from '../notification-center';

@injectable()
export class BoardsDataStore implements FrontendApplicationContribution {
  @inject(ILogger)
  @named('store')
  protected readonly logger: ILogger;

  @inject(BoardsService)
  protected readonly boardsService: BoardsService;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  @inject(LocalStorageService)
  protected readonly storageService: LocalStorageService;

  protected readonly onChangedEmitter = new Emitter<string[]>();

  onStart(): void {
    this.notificationCenter.onPlatformDidInstall(async ({ item }) => {
      const dataDidChangePerFqbn: string[] = [];
      for (const fqbn of item.boards
        .map(({ fqbn }) => fqbn)
        .filter(notEmpty)
        .filter((fqbn) => !!fqbn)) {
        const key = this.getStorageKey(fqbn);
        let data = await this.storageService.getData<
          ConfigOption[] | undefined
        >(key);
        if (!data || !data.length) {
          const details = await this.getBoardDetailsSafe(fqbn);
          if (details) {
            data = details.configOptions;
            if (data.length) {
              await this.storageService.setData(key, data);
              dataDidChangePerFqbn.push(fqbn);
            }
          }
        }
      }
      if (dataDidChangePerFqbn.length) {
        this.fireChanged(...dataDidChangePerFqbn);
      }
    });
  }

  get onChanged(): Event<string[]> {
    return this.onChangedEmitter.event;
  }

  async appendConfigToFqbn(
    fqbn: string | undefined,
  ): Promise<string | undefined> {
    if (!fqbn) {
      return undefined;
    }
    const { configOptions } = await this.getData(fqbn);
    return ConfigOption.decorate(fqbn, configOptions);
  }

  async getData(fqbn: string | undefined): Promise<BoardsDataStore.Data> {
    if (!fqbn) {
      return BoardsDataStore.Data.EMPTY;
    }

    const key = this.getStorageKey(fqbn);
    let data = await this.storageService.getData<
      BoardsDataStore.Data | undefined
    >(key, undefined);
    if (BoardsDataStore.Data.is(data)) {
      return data;
    }

    const boardDetails = await this.getBoardDetailsSafe(fqbn);
    if (!boardDetails) {
      return BoardsDataStore.Data.EMPTY;
    }

    data = {
      configOptions: boardDetails.configOptions,
      programmers: boardDetails.programmers,
    };
    await this.storageService.setData(key, data);
    return data;
  }

  async selectProgrammer(
    {
      fqbn,
      selectedProgrammer,
    }: { fqbn: string; selectedProgrammer: Programmer },
  ): Promise<boolean> {
    const data = deepClone(await this.getData(fqbn));
    const { programmers } = data;
    if (!programmers.find((p) => Programmer.equals(selectedProgrammer, p))) {
      return false;
    }

    await this.setData({
      fqbn,
      data: { ...data, selectedProgrammer },
    });
    this.fireChanged(fqbn);
    return true;
  }

  async selectConfigOption(
    {
      fqbn,
      option,
      selectedValue,
    }: { fqbn: string; option: string; selectedValue: string }
  ): Promise<boolean> {
    const data = deepClone(await this.getData(fqbn));
    const { configOptions } = data;
    const configOption = configOptions.find((c) => c.option === option);
    if (!configOption) {
      return false;
    }
    let updated = false;
    for (const value of configOption.values) {
      if (value.value === selectedValue) {
        (value as any).selected = true;
        updated = true;
      } else {
        (value as any).selected = false;
      }
    }
    if (!updated) {
      return false;
    }
    await this.setData({ fqbn, data });
    this.fireChanged(fqbn);
    return true;
  }

  protected async setData({
    fqbn,
    data,
  }: {
    fqbn: string;
    data: BoardsDataStore.Data;
  }): Promise<void> {
    const key = this.getStorageKey(fqbn);
    return this.storageService.setData(key, data);
  }

  protected getStorageKey(fqbn: string): string {
    return `.arduinoIDE-configOptions-${fqbn}`;
  }

  protected async getBoardDetailsSafe(
    fqbn: string
  ): Promise<BoardDetails | undefined> {
    try {
      const details = this.boardsService.getBoardDetails({ fqbn });
      return details;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('loading board data') &&
        err.message.includes('is not installed')
      ) {
        this.logger.warn(
          `The boards package is not installed for board with FQBN: ${fqbn}`
        );
      } else {
        this.logger.error(
          `An unexpected error occurred while retrieving the board details for ${fqbn}.`,
          err
        );
      }
      return undefined;
    }
  }

  protected fireChanged(...fqbn: string[]): void {
    this.onChangedEmitter.fire(fqbn);
  }
}

export namespace BoardsDataStore {
  export interface Data {
    readonly configOptions: ConfigOption[];
    readonly programmers: Programmer[];
    readonly selectedProgrammer?: Programmer;
  }
  export namespace Data {
    export const EMPTY: Data = {
      configOptions: [],
      programmers: [],
    };
    export function is(arg: any): arg is Data {
      return (
        !!arg &&
        'configOptions' in arg &&
        Array.isArray(arg['configOptions']) &&
        'programmers' in arg &&
        Array.isArray(arg['programmers'])
      );
    }
  }
}
