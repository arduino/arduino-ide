import { injectable, inject, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { MaybePromise } from '@theia/core/lib/common/types';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { deepClone, notEmpty } from '@theia/core/lib/common/objects';
import { FrontendApplicationContribution, LocalStorageService } from '@theia/core/lib/browser';
import { BoardsService, ConfigOption, Installable, BoardDetails } from '../../common/protocol';
import { BoardsServiceClientImpl } from './boards-service-client-impl';

@injectable()
export class BoardsConfigStore implements FrontendApplicationContribution {

    @inject(ILogger)
    @named('store')
    protected readonly logger: ILogger;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(LocalStorageService)
    protected readonly storageService: LocalStorageService;

    protected readonly onChangedEmitter = new Emitter<void>();

    onStart(): void {
        this.boardsServiceClient.onBoardsPackageInstalled(async ({ pkg }) => {
            const { installedVersion: version } = pkg;
            if (!version) {
                return;
            }
            let shouldFireChanged = false;
            for (const fqbn of pkg.boards.map(({ fqbn }) => fqbn).filter(notEmpty).filter(fqbn => !!fqbn)) {
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

        const configOptions = await this.getConfig(fqbn, boardsPackageVersion);
        return ConfigOption.decorate(fqbn, configOptions);
    }

    async getConfig(
        fqbn: string,
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<ConfigOption[]> {

        const version = await boardsPackageVersion;
        if (!version) {
            return [];
        }
        const key = this.getStorageKey(fqbn, version);
        let configOptions = await this.storageService.getData<ConfigOption[] | undefined>(key, undefined);
        if (configOptions) {
            return configOptions;
        }

        const details = await this.getBoardDetailsSafe(fqbn);
        if (!details) {
            return [];
        }

        configOptions = details.configOptions;
        await this.storageService.setData(key, configOptions);
        return configOptions;
    }

    async setSelected(
        { fqbn, option, selectedValue }: { fqbn: string, option: string, selectedValue: string },
        boardsPackageVersion: MaybePromise<Installable.Version | undefined> = this.getBoardsPackageVersion(fqbn)): Promise<boolean> {

        const configOptions = deepClone(await this.getConfig(fqbn, boardsPackageVersion));
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
        await this.setConfig({ fqbn, configOptions, version });
        this.fireChanged();
        return true;
    }

    protected async setConfig(
        { fqbn, configOptions, version }: { fqbn: string, configOptions: ConfigOption[], version: Installable.Version }): Promise<void> {

        const key = this.getStorageKey(fqbn, version);
        return this.storageService.setData(key, configOptions);
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
