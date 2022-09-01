import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MenuModelRegistry } from '@theia/core/lib/common/menu/menu-model-registry';
import type { MenuPath } from '@theia/core/lib/common/menu/menu-types';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MainMenuManager } from '../../common/main-menu-manager';
import {
  BoardsService,
  BoardWithPackage,
  createPlatformIdentifier,
  getBoardInfo,
  InstalledBoardWithPackage,
  platformIdentifierEquals,
  Port,
  serializePlatformIdentifier,
} from '../../common/protocol';
import type { BoardList } from '../../common/protocol/board-list';
import { BoardsListWidget } from '../boards/boards-list-widget';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  ArduinoMenus,
  PlaceholderMenuNode,
  unregisterSubmenu,
} from '../menu/arduino-menus';
import { NotificationCenter } from '../notification-center';
import { Command, CommandRegistry, SketchContribution } from './contribution';

@injectable()
export class BoardSelection extends SketchContribution {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(MainMenuManager)
  private readonly mainMenuManager: MainMenuManager;
  @inject(MenuModelRegistry)
  private readonly menuModelRegistry: MenuModelRegistry;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  private readonly toDisposeBeforeMenuRebuild = new DisposableCollection();
  // do not query installed platforms on every change
  private _installedBoards: Deferred<InstalledBoardWithPackage[]> | undefined;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(BoardSelection.Commands.GET_BOARD_INFO, {
      execute: async () => {
        const boardInfo = await getBoardInfo(
          this.boardsServiceProvider.boardList
        );
        if (typeof boardInfo === 'string') {
          this.messageService.info(boardInfo);
          return;
        }
        const { BN, VID, PID, SN } = boardInfo;
        const detail = `
BN: ${BN}
VID: ${VID}
PID: ${PID}
SN: ${SN}
`.trim();
        await this.dialogService.showMessageBox({
          message: nls.localize('arduino/board/boardInfo', 'Board Info'),
          title: nls.localize('arduino/board/boardInfo', 'Board Info'),
          type: 'info',
          detail,
          buttons: [nls.localize('vscode/issueMainService/ok', 'OK')],
        });
      },
    });
  }

  override onStart(): void {
    this.notificationCenter.onPlatformDidInstall(() => this.updateMenus(true));
    this.notificationCenter.onPlatformDidUninstall(() =>
      this.updateMenus(true)
    );
    this.boardsServiceProvider.onBoardListDidChange(() => this.updateMenus());
  }

  override async onReady(): Promise<void> {
    this.updateMenus();
  }

  private async updateMenus(discardCache = false): Promise<void> {
    if (discardCache) {
      this._installedBoards?.reject();
      this._installedBoards = undefined;
    }
    if (!this._installedBoards) {
      this._installedBoards = new Deferred();
      this.installedBoards().then((installedBoards) =>
        this._installedBoards?.resolve(installedBoards)
      );
    }
    const installedBoards = await this._installedBoards.promise;
    this.rebuildMenus(installedBoards, this.boardsServiceProvider.boardList);
  }

  private rebuildMenus(
    installedBoards: InstalledBoardWithPackage[],
    boardList: BoardList
  ): void {
    this.toDisposeBeforeMenuRebuild.dispose();

    // Boards submenu
    const boardsSubmenuPath = [
      ...ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP,
      '1_boards',
    ];
    const { selectedBoard, selectedPort } = boardList.boardsConfig;
    const boardsSubmenuLabel = selectedBoard?.name;
    // Note: The submenu order starts from `100` because `Auto Format`, `Serial Monitor`, etc starts from `0` index.
    // The board specific items, and the rest, have order with `z`. We needed something between `0` and `z` with natural-order.
    this.menuModelRegistry.registerSubmenu(
      boardsSubmenuPath,
      nls.localize(
        'arduino/board/board',
        'Board{0}',
        !!boardsSubmenuLabel ? `: "${boardsSubmenuLabel}"` : ''
      ),
      { order: '100' }
    );
    this.toDisposeBeforeMenuRebuild.push(
      Disposable.create(() =>
        unregisterSubmenu(boardsSubmenuPath, this.menuModelRegistry)
      )
    );

    // Ports submenu
    const portsSubmenuPath = ArduinoMenus.TOOLS__PORTS_SUBMENU;
    const portsSubmenuLabel = selectedPort?.address;
    this.menuModelRegistry.registerSubmenu(
      portsSubmenuPath,
      nls.localize(
        'arduino/board/port',
        'Port{0}',
        portsSubmenuLabel ? `: "${portsSubmenuLabel}"` : ''
      ),
      { order: '101' }
    );
    this.toDisposeBeforeMenuRebuild.push(
      Disposable.create(() =>
        unregisterSubmenu(portsSubmenuPath, this.menuModelRegistry)
      )
    );

    const getBoardInfo = {
      commandId: BoardSelection.Commands.GET_BOARD_INFO.id,
      label: nls.localize('arduino/board/getBoardInfo', 'Get Board Info'),
      order: '103',
    };
    this.menuModelRegistry.registerMenuAction(
      ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP,
      getBoardInfo
    );
    this.toDisposeBeforeMenuRebuild.push(
      Disposable.create(() =>
        this.menuModelRegistry.unregisterMenuAction(getBoardInfo)
      )
    );

    const boardsManagerGroup = [...boardsSubmenuPath, '0_manager'];
    const boardsPackagesGroup = [...boardsSubmenuPath, '1_packages'];

    this.menuModelRegistry.registerMenuAction(boardsManagerGroup, {
      commandId: `${BoardsListWidget.WIDGET_ID}:toggle`,
      label: `${BoardsListWidget.WIDGET_LABEL}...`,
    });

    const selectedBoardPlatformId = selectedBoard
      ? createPlatformIdentifier(selectedBoard)
      : undefined;

    // Keys are the vendor IDs
    type BoardsPerVendor = Record<string, BoardWithPackage[]>;
    // Group boards by their platform names. The keys are the platform names as menu labels.
    // If there is a platform name (menu label) collision, refine the menu label with the vendor ID.
    const groupedBoards = new Map<string, BoardsPerVendor>();
    for (const board of installedBoards) {
      const { packageId, packageName } = board;
      const { vendorId } = packageId;
      let boardsPerPackageName = groupedBoards.get(packageName);
      if (!boardsPerPackageName) {
        boardsPerPackageName = {} as BoardsPerVendor;
        groupedBoards.set(packageName, boardsPerPackageName);
      }
      let boardPerVendor: BoardWithPackage[] | undefined =
        boardsPerPackageName[vendorId];
      if (!boardPerVendor) {
        boardPerVendor = [];
        boardsPerPackageName[vendorId] = boardPerVendor;
      }
      boardPerVendor.push(board);
    }

    // Installed boards
    Array.from(groupedBoards.entries()).forEach(
      ([packageName, boardsPerPackage]) => {
        const useVendorSuffix = Object.keys(boardsPerPackage).length > 1;
        Object.entries(boardsPerPackage).forEach(([vendorId, boards]) => {
          let platformMenuPath: MenuPath | undefined = undefined;
          boards.forEach((board, index) => {
            const { packageId, fqbn, name, manuallyInstalled } = board;
            // create the platform submenu once.
            // creating and registering the same submenu twice in Theia is a noop, though.
            if (!platformMenuPath) {
              let packageLabel =
                packageName +
                `${
                  manuallyInstalled
                    ? nls.localize(
                        'arduino/board/inSketchbook',
                        ' (in Sketchbook)'
                      )
                    : ''
                }`;
              if (
                selectedBoardPlatformId &&
                platformIdentifierEquals(packageId, selectedBoardPlatformId)
              ) {
                packageLabel = `● ${packageLabel}`;
              }
              if (useVendorSuffix) {
                packageLabel += ` (${vendorId})`;
              }
              // Platform submenu
              platformMenuPath = [
                ...boardsPackagesGroup,
                serializePlatformIdentifier(packageId),
              ];
              this.menuModelRegistry.registerSubmenu(
                platformMenuPath,
                packageLabel,
                {
                  order: packageName.toLowerCase(),
                }
              );
            }

            const id = `arduino-select-board--${fqbn}`;
            const command = { id };
            const handler = {
              execute: () =>
                this.boardsServiceProvider.updateConfig({
                  name: name,
                  fqbn: fqbn,
                }),
              isToggled: () => fqbn === selectedBoard?.fqbn,
            };

            // Board menu
            const menuAction = {
              commandId: id,
              label: name,
              order: String(index).padStart(4), // pads with leading zeros for alphanumeric sort where order is 1, 2, 11, and NOT 1, 11, 2
            };
            this.commandRegistry.registerCommand(command, handler);
            this.toDisposeBeforeMenuRebuild.push(
              Disposable.create(() =>
                this.commandRegistry.unregisterCommand(command)
              )
            );
            this.menuModelRegistry.registerMenuAction(
              platformMenuPath,
              menuAction
            );
            // Note: we do not dispose the menu actions individually. Calling `unregisterSubmenu` on the parent will wipe the children menu nodes recursively.
          });
        });
      }
    );

    // Detected ports
    const registerPorts = (
      protocol: string,
      ports: ReturnType<BoardList['ports']>,
      protocolOrder: number
    ) => {
      if (!ports.length) {
        return;
      }

      // Register placeholder for protocol
      const menuPath = [
        ...portsSubmenuPath,
        `${protocolOrder.toString()}_${protocol}`,
      ];
      const placeholder = new PlaceholderMenuNode(
        menuPath,
        nls.localize(
          'arduino/board/typeOfPorts',
          '{0} ports',
          Port.Protocols.protocolLabel(protocol)
        ),
        { order: protocolOrder.toString().padStart(4) }
      );
      this.menuModelRegistry.registerMenuNode(menuPath, placeholder);
      this.toDisposeBeforeMenuRebuild.push(
        Disposable.create(() =>
          this.menuModelRegistry.unregisterMenuNode(placeholder.id)
        )
      );

      for (let i = 0; i < ports.length; i++) {
        const { port, boards } = ports[i];
        const portKey = Port.keyOf(port);
        let label = `${port.addressLabel}`;
        if (boards?.length) {
          const boardsList = boards.map((board) => board.name).join(', ');
          label = `${label} (${boardsList})`;
        }
        const id = `arduino-select-port--${portKey}`;
        const command = { id };
        const handler = {
          execute: () => {
            this.boardsServiceProvider.updateConfig({
              protocol: port.protocol,
              address: port.address,
            });
          },
          isToggled: () => {
            return i === ports.matchingIndex;
          },
        };
        const menuAction = {
          commandId: id,
          label,
          order: String(protocolOrder + i + 1).padStart(4),
        };
        this.commandRegistry.registerCommand(command, handler);
        this.toDisposeBeforeMenuRebuild.push(
          Disposable.create(() =>
            this.commandRegistry.unregisterCommand(command)
          )
        );
        this.menuModelRegistry.registerMenuAction(menuPath, menuAction);
      }
    };

    const groupedPorts = boardList.portsGroupedByProtocol();
    let protocolOrder = 100;
    Object.entries(groupedPorts).forEach(([protocol, ports]) => {
      registerPorts(protocol, ports, protocolOrder);
      protocolOrder += 100;
    });
    this.mainMenuManager.update();
  }

  protected async installedBoards(): Promise<InstalledBoardWithPackage[]> {
    const allBoards = await this.boardsService.getInstalledBoards();
    return allBoards.filter(InstalledBoardWithPackage.is);
  }
}
export namespace BoardSelection {
  export namespace Commands {
    export const GET_BOARD_INFO: Command = { id: 'arduino-get-board-info' };
  }
}
