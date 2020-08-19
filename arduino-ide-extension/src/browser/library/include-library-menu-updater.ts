import * as PQueue from 'p-queue';
import { inject, injectable } from 'inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { ArduinoMenus } from '../menu/arduino-menus';
import { LibraryPackage } from '../../common/protocol';
import { IncludeLibrary } from '../contributions/include-library';
import { MainMenuManager } from '../../common/main-menu-manager';
import { LibraryListWidget } from './library-list-widget';
import { LibraryServiceProvider } from './library-service-provider';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';

@injectable()
export class IncludeLibraryMenuUpdater implements FrontendApplicationContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(LibraryServiceProvider)
    protected readonly libraryServiceProvider: LibraryServiceProvider;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    protected readonly queue = new PQueue({ autoStart: true, concurrency: 1 });
    protected readonly toDispose = new DisposableCollection();

    async onStart(): Promise<void> {
        this.updateMenuActions();
        this.boardsServiceClient.onBoardsConfigChanged(() => this.updateMenuActions())
        this.libraryServiceProvider.onLibraryPackageInstalled(() => this.updateMenuActions());
        this.libraryServiceProvider.onLibraryPackageUninstalled(() => this.updateMenuActions());
    }

    protected async updateMenuActions(): Promise<void> {
        return this.queue.add(async () => {
            this.toDispose.dispose();
            this.mainMenuManager.update();
            const libraries: LibraryPackage[] = []
            const fqbn = this.boardsServiceClient.boardsConfig.selectedBoard?.fqbn;
            // Do not show board specific examples, when no board is selected.
            if (fqbn) {
                libraries.push(...await this.libraryServiceProvider.list({ fqbn }));
            }

            // `Include Library` submenu
            const includeLibMenuPath = [...ArduinoMenus.SKETCH__UTILS_GROUP, '0_include'];
            this.menuRegistry.registerSubmenu(includeLibMenuPath, 'Include Library', { order: '1' });
            // `Manage Libraries...` group.
            this.menuRegistry.registerMenuAction([...includeLibMenuPath, '0_manage'], {
                commandId: `${LibraryListWidget.WIDGET_ID}:toggle`,
                label: 'Manage Libraries...'
            });
            this.toDispose.push(Disposable.create(() => this.menuRegistry.unregisterMenuAction({ commandId: `${LibraryListWidget.WIDGET_ID}:toggle` })));

            // `Add .ZIP Library...`
            // TODO: implement it

            // `Arduino libraries`
            const arduinoLibsMenuPath = [...includeLibMenuPath, '2_arduino'];
            for (const library of libraries.filter(({ author }) => author.toLowerCase() === 'arduino')) {
                this.toDispose.push(this.registerLibrary(library, arduinoLibsMenuPath));
            }

            const contributedLibsMenuPath = [...includeLibMenuPath, '3_contributed'];
            for (const library of libraries.filter(({ author }) => author.toLowerCase() !== 'arduino')) {
                this.toDispose.push(this.registerLibrary(library, contributedLibsMenuPath));
            }

            this.mainMenuManager.update();
        });
    }

    protected registerLibrary(library: LibraryPackage, menuPath: MenuPath): Disposable {
        const commandId = `arduino-include-library--${library.name}:${library.author}`;
        const command = { id: commandId };
        const handler = { execute: () => this.commandRegistry.executeCommand(IncludeLibrary.Commands.INCLUDE_LIBRARY.id, library) };
        const menuAction = { commandId, label: library.name };
        this.menuRegistry.registerMenuAction(menuPath, menuAction);
        return new DisposableCollection(
            this.commandRegistry.registerCommand(command, handler),
            Disposable.create(() => this.menuRegistry.unregisterMenuAction(menuAction)),
        );
    }

}
