import { injectable, inject } from 'inversify';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import {
    Command,
    CommandContribution,
    CommandRegistry,
} from '@theia/core/lib/common/command';

/**
 * This is a workaround to break cycles in the dependency injection. Provides commands for `setData` and `getData`.
 */
@injectable()
export class StorageWrapper implements CommandContribution {
    @inject(StorageService)
    protected storageService: StorageService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(StorageWrapper.Commands.GET_DATA, {
            execute: (key: string, defaultValue?: any) =>
                this.storageService.getData(key, defaultValue),
        });
        commands.registerCommand(StorageWrapper.Commands.SET_DATA, {
            execute: (key: string, value: any) =>
                this.storageService.setData(key, value),
        });
    }
}
export namespace StorageWrapper {
    export namespace Commands {
        export const SET_DATA: Command = {
            id: 'arduino-store-wrapper-set',
        };
        export const GET_DATA: Command = {
            id: 'arduino-store-wrapper-get',
        };
    }
}
