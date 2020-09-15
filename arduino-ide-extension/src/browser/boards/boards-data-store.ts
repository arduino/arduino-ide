import { injectable, inject, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { deepClone } from '@theia/core/lib/common/objects';
import { MaybePromise } from '@theia/core/lib/common/types';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { FrontendApplicationContribution, LocalStorageService } from '@theia/core/lib/browser';
import { notEmpty } from '../../common/utils';
import { BoardsService, ConfigOption, Installable, BoardDetails, Programmer } from '../../common/protocol';
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

    protected readonly onChangedEmitter = new Emitter<void>();

    onStart(): void {
        this.notificationCenter.onPlatformInstalled(async ({ item }) => {
            const { installedVersion: version } = item;
            if (!version) {
                return;
            }
            let shouldFireChanged = false;
            for (const fqbn of item.boards.map(({ fqbn }) => fqbn).filter(notEmpty).filter(fqbn => !!fqbn)) {
                const key = this.getStorageKey(fqbn, version);
                let data = await this.storageService.getData<ConfigOption[] | undefined>(key);
                if (!data || !data.length) {
                    const details = await this.getBoardDetailsSafe(fqbn);
                    if (details) {
                        data = details.configOptions;
                        if (data.length) {
                            await this.storageService.setData(key, data);
                            shouldFireChanged = true;
                        }
                    }
                }
            }
            if (shouldFireChanged) {
                this.fireChanged();
            }
        });
    }

    get onChanged(): Event<void> {
        return this.onChangedEmitter.event;
    }

    async appendConfigToFqbn(
        fqbn: string,
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<string> {

        const { configOptions } = await this.getData(fqbn, boardsPackageVersion);
        return ConfigOption.decorate(fqbn, configOptions);
    }

    async getData(
        fqbn: string,
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<BoardsDataStore.Data> {

        const version = await boardsPackageVersion;
        if (!version) {
            return BoardsDataStore.Data.EMPTY;
        }
        const key = this.getStorageKey(fqbn, version);
        let data = await this.storageService.getData<BoardsDataStore.Data | undefined>(key, undefined);
        if (data) {
            // If `configOptions` is empty we rather reload the data. See arduino/arduino-cli#954 and arduino/arduino-cli#955.
            if (data.configOptions.length && data.programmers !== undefined) { // to be backward compatible. We did not save the `programmers` into the `localStorage`.
                return data;
            }
        }

        const boardDetails = await this.getBoardDetailsSafe(fqbn);
        if (!boardDetails) {
            return BoardsDataStore.Data.EMPTY;
        }

        data = { configOptions: boardDetails.configOptions, programmers: boardDetails.programmers };
        await this.storageService.setData(key, data);
        return data;
    }

    async selectProgrammer(
        { fqbn, selectedProgrammer }: { fqbn: string, selectedProgrammer: Programmer },
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<boolean> {

        const data = deepClone(await this.getData(fqbn, boardsPackageVersion));
        const { programmers } = data;
        if (!programmers.find(p => Programmer.equals(selectedProgrammer, p))) {
            return false;
        }

        const version = await boardsPackageVersion;
        if (!version) {
            return false;
        }

        await this.setData({ fqbn, data: { ...data, selectedProgrammer }, version });
        this.fireChanged();
        return true;
    }

    async selectConfigOption(
        { fqbn, option, selectedValue }: { fqbn: string, option: string, selectedValue: string },
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<boolean> {

        const data = deepClone(await this.getData(fqbn, boardsPackageVersion));
        const { configOptions } = data;
        const configOption = configOptions.find(c => c.option === option);
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
        const version = await boardsPackageVersion;
        if (!version) {
            return false;
        }

        await this.setData({ fqbn, data, version });
        this.fireChanged();
        return true;
    }

    protected async setData(
        { fqbn, data, version }: { fqbn: string, data: BoardsDataStore.Data, version: Installable.Version }): Promise<void> {

        const key = this.getStorageKey(fqbn, version);
        return this.storageService.setData(key, data);
    }

    protected getStorageKey(fqbn: string, version: Installable.Version): string {
        return `.arduinoProIDE-configOptions-${version}-${fqbn}`;
    }

    protected async getBoardDetailsSafe(fqbn: string): Promise<BoardDetails | undefined> {
        try {
            const details = this.boardsService.getBoardDetails({ fqbn });
            return details;
        } catch (err) {
            if (err instanceof Error && err.message.includes('loading board data') && err.message.includes('is not installed')) {
                this.logger.warn(`The boards package is not installed for board with FQBN: ${fqbn}`);
            } else {
                this.logger.error(`An unexpected error occurred while retrieving the board details for ${fqbn}.`, err);
            }
            return undefined;
        }
    }

    protected fireChanged(): void {
        this.onChangedEmitter.fire();
    }

    protected async getBoardsPackageVersion(fqbn: string): Promise<Installable.Version | undefined> {
        if (!fqbn) {
            return undefined;
        }
        const boardsPackage = await this.boardsService.getContainerBoardPackage({ fqbn });
        if (!boardsPackage) {
            return undefined;
        }
        return boardsPackage.installedVersion;
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
            programmers: []
        };
    }
}
