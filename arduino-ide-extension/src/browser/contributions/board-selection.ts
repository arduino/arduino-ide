import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { DisposableCollection, Disposable } from '@theia/core/lib/common/disposable';
import { BoardsConfig } from '../boards/boards-config';
import { MainMenuManager } from '../../common/main-menu-manager';
import { BoardsListWidget } from '../boards/boards-list-widget';
import { NotificationCenter } from '../notification-center';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ArduinoMenus, unregisterSubmenu } from '../menu/arduino-menus';
import { BoardsService, InstalledBoardWithPackage, AvailablePorts, Port } from '../../common/protocol';
import { SketchContribution, Command, CommandRegistry } from './contribution';

@injectable()
export class BoardSelection extends SketchContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(MenuModelRegistry)
    protected readonly menuModelRegistry: MenuModelRegistry;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider;

    protected readonly toDisposeBeforeMenuRebuild = new DisposableCollection();

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(BoardSelection.Commands.GET_BOARD_INFO, {
            execute: async () => {
                const { selectedBoard, selectedPort } = this.boardsServiceProvider.boardsConfig;
                if (!selectedBoard) {
                    this.messageService.info('Please select a board to obtain board info.');
                    return;
                }
                if (!selectedBoard.fqbn) {
                    this.messageService.info(`The platform for the selected '${selectedBoard.name}' board is not installed.`);
                    return;
                }
                if (!selectedPort) {
                    this.messageService.info('Please select a port to obtain board info.');
                    return;
                }
                const boardDetails = await this.boardsService.getBoardDetails({ fqbn: selectedBoard.fqbn });
                if (boardDetails) {
                    const { VID, PID } = boardDetails;
                    const detail = `BN: ${selectedBoard.name}
VID: ${VID}
PID: ${PID}`;
                    await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
                        message: 'Board Info',
                        title: 'Board Info',
                        type: 'info',
                        detail,
                        buttons: ['OK']
                    });
                }
            }
        });
    }

    onStart(): void {
        this.updateMenus();
        this.notificationCenter.onPlatformInstalled(this.updateMenus.bind(this));
        this.notificationCenter.onPlatformUninstalled(this.updateMenus.bind(this));
        this.boardsServiceProvider.onBoardsConfigChanged(this.updateMenus.bind(this));
        this.boardsServiceProvider.onAvailableBoardsChanged(this.updateMenus.bind(this));
    }

    protected async updateMenus(): Promise<void> {
        const [installedBoards, availablePorts, config] = await Promise.all([
            this.installedBoards(),
            this.boardsService.getState(),
            this.boardsServiceProvider.boardsConfig
        ]);
        this.rebuildMenus(installedBoards, availablePorts, config);
    }

    protected rebuildMenus(installedBoards: InstalledBoardWithPackage[], availablePorts: AvailablePorts, config: BoardsConfig.Config): void {
        this.toDisposeBeforeMenuRebuild.dispose();

        // Boards submenu
        const boardsSubmenuPath = [...ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP, '1_boards'];
        const boardsSubmenuLabel = config.selectedBoard?.name;
        // Note: The submenu order starts from `100` because `Auto Format`, `Serial Monitor`, etc starts from `0` index.
        // The board specific items, and the rest, have order with `z`. We needed something between `0` and `z` with natural-order.
        this.menuModelRegistry.registerSubmenu(boardsSubmenuPath, `Board${!!boardsSubmenuLabel ? `: "${boardsSubmenuLabel}"` : ''}`, { order: '100' });
        this.toDisposeBeforeMenuRebuild.push(Disposable.create(() => unregisterSubmenu(boardsSubmenuPath, this.menuModelRegistry)));

        // Ports submenu
        const portsSubmenuPath = [...ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP, '2_ports'];
        const portsSubmenuLabel = config.selectedPort?.address;
        this.menuModelRegistry.registerSubmenu(portsSubmenuPath, `Port${!!portsSubmenuLabel ? `: "${portsSubmenuLabel}"` : ''}`, { order: '101' });
        this.toDisposeBeforeMenuRebuild.push(Disposable.create(() => unregisterSubmenu(portsSubmenuPath, this.menuModelRegistry)));

        const getBoardInfo = { commandId: BoardSelection.Commands.GET_BOARD_INFO.id, label: 'Get Board Info', order: '103' };
        this.menuModelRegistry.registerMenuAction(ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP, getBoardInfo);
        this.toDisposeBeforeMenuRebuild.push(Disposable.create(() => this.menuModelRegistry.unregisterMenuAction(getBoardInfo)));

        const boardsManagerGroup = [...boardsSubmenuPath, '0_manager'];
        const boardsPackagesGroup = [...boardsSubmenuPath, '1_packages'];

        this.menuModelRegistry.registerMenuAction(boardsManagerGroup, {
            commandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
            label: 'Boards Manager...'
        });

        // Installed boards
        for (const board of installedBoards) {
            const { packageId, packageName, fqbn, name } = board;

            // Platform submenu
            const platformMenuPath = [...boardsPackagesGroup, packageId];
            // Note: Registering the same submenu twice is a noop. No need to group the boards per platform.
            this.menuModelRegistry.registerSubmenu(platformMenuPath, packageName);

            const id = `arduino-select-board--${fqbn}`;
            const command = { id };
            const handler = {
                execute: () => {
                    if (fqbn !== this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn) {
                        this.boardsServiceProvider.boardsConfig = {
                            selectedBoard: {
                                name,
                                fqbn,
                                port: this.boardsServiceProvider.boardsConfig.selectedBoard?.port // TODO: verify!
                            },
                            selectedPort: this.boardsServiceProvider.boardsConfig.selectedPort
                        }
                    }
                },
                isToggled: () => fqbn === this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn
            };

            // Board menu
            const menuAction = { commandId: id, label: name };
            this.commandRegistry.registerCommand(command, handler);
            this.toDisposeBeforeMenuRebuild.push(Disposable.create(() => this.commandRegistry.unregisterCommand(command)));
            this.menuModelRegistry.registerMenuAction(platformMenuPath, menuAction);
            // Note: we do not dispose the menu actions individually. Calling `unregisterSubmenu` on the parent will wipe the children menu nodes recursively.
        }

        // Installed ports
        for (const address of Object.keys(availablePorts)) {
            if (!!availablePorts[address]) {
                const [port, boards] = availablePorts[address];
                if (!boards.length) {
                    boards.push({
                        name: ''
                    });
                }
                for (const { name, fqbn } of boards) {
                    const id = `arduino-select-port--${address}${fqbn ? `--${fqbn}` : ''}`;
                    const command = { id };
                    const handler = {
                        execute: () => {
                            if (!Port.equals(port, this.boardsServiceProvider.boardsConfig.selectedPort)) {
                                this.boardsServiceProvider.boardsConfig = {
                                    selectedBoard: this.boardsServiceProvider.boardsConfig.selectedBoard,
                                    selectedPort: port
                                }
                            }
                        },
                        isToggled: () => Port.equals(port, this.boardsServiceProvider.boardsConfig.selectedPort)
                    };
                    const menuAction = {
                        commandId: id,
                        label: `${address}${name ? ` (${name})` : ''}`
                    };
                    this.commandRegistry.registerCommand(command, handler);
                    this.toDisposeBeforeMenuRebuild.push(Disposable.create(() => this.commandRegistry.unregisterCommand(command)));
                    this.menuModelRegistry.registerMenuAction(portsSubmenuPath, menuAction);
                }
            }
        }

        this.mainMenuManager.update();
    }

    protected async installedBoards(): Promise<InstalledBoardWithPackage[]> {
        const allBoards = await this.boardsService.allBoards({});
        return allBoards.filter(InstalledBoardWithPackage.is);
    }

}
export namespace BoardSelection {
    export namespace Commands {
        export const GET_BOARD_INFO: Command = { id: 'arduino-get-board-info' };
    }
}
