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
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { NotificationCenter } from '../notification-center';
import { Command, CommandRegistry, SketchContribution } from './contribution';
import { SidebarMenu } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
import { CreateFeatures } from '../create/create-features';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';

export const PortMenu: SidebarMenu = {
  id: 'arduino-port-sketch',
  iconClass: 'fa lingzhi-connect-left',
  title: '连接',
  menuPath: ['100_serial'],
  order: 3,
};

@injectable()
export class BoardSelection extends SketchContribution {
  // 注入 CommandRegistry，用于注册命令
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  // 注入 MainMenuManager，用于管理主菜单
  @inject(MainMenuManager)
  private readonly mainMenuManager: MainMenuManager;
  // 注入 MenuModelRegistry，用于管理菜单模型
  @inject(MenuModelRegistry)
  private readonly menuModelRegistry: MenuModelRegistry;
  // 注入 NotificationCenter，用于接收通知
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;
  // 注入 BoardsService，用于与开发板服务进行交互
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  // 注入 BoardsServiceProvider，用于获取开发板列表等信息
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  // 用于在菜单重建前处理可弃用对象的集合
  private readonly toDisposeBeforeMenuRebuild = new DisposableCollection();
  // 不每次改变时都查询已安装的平台
  private _installedBoards: Deferred<InstalledBoardWithPackage[]> | undefined;

  // 重写 SketchContribution 的 registerCommands 方法
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(BoardSelection.Commands.GET_BOARD_INFO, {
      // 当执行获取开发板信息的命令时的操作
      execute: async () => {
        const boardInfo = await getBoardInfo(
          this.boardsServiceProvider.boardList
        );
        // 如果返回的是字符串，说明没有获取到具体的开发板信息，显示信息提示
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
          buttons: [nls.localize('vscode/issueMainService/ok', '确定')],
        });
      },
    });

    registry.registerCommand(BoardSelection.Commands.RELOAD_BOARD_DATA, {
      execute: async () => {
        const selectedFqbn =
          this.boardsServiceProvider.boardList.boardsConfig.selectedBoard?.fqbn;
        let message: string;

        if (selectedFqbn) {
          await this.boardsDataStore.reloadBoardData(selectedFqbn);
          message = nls.localize(
            'arduino/board/boardDataReloaded',
            'Board data reloaded.'
          );
        } else {
          message = nls.localize(
            'arduino/board/selectBoardToReload',
            'Please select a board first.'
          );
        }

        this.messageService.info(message, { timeout: 2000 });
      },
    });
  }

  @inject(CreateFeatures)
  private app: FrontendApplication;

  // 重写 SketchContribution 的 onStart 方法
  override onStart(app: FrontendApplication): void {
    // 订阅平台安装事件，当平台安装时调用 updateMenus 方法并传入 true
    this.notificationCenter.onPlatformDidInstall(() => this.updateMenus(true));
    // 订阅平台卸载事件，当平台卸载时调用 updateMenus 方法并传入 true
    this.notificationCenter.onPlatformDidUninstall(() =>
      this.updateMenus(true)
    );
    // 订阅开发板列表变化事件，当开发板列表变化时调用 updateMenus 方法
    this.boardsServiceProvider.onBoardListDidChange(() => this.updateMenus());

    this.app = app;
    // 在 onStart 方法中添加新菜单
    const handler = this.app.shell.leftPanelHandler;
    handler.addBottomMenu(PortMenu);
  }

  // 重写 SketchContribution 的 onReady 方法
  override async onReady(): Promise<void> {
    // 启动时调用 updateMenus 方法进行菜单初始化
    this.updateMenus();
  }

  public async updateMenus(discardCache = false): Promise<void> {
    // 如果 discardCache 为 true，则拒绝并重置 _installedBoards 的延迟对象
    if (discardCache) {
      this._installedBoards?.reject();
      this._installedBoards = undefined;
    }
    // 如果 _installedBoards 未定义，则创建一个新的延迟对象
    if (!this._installedBoards) {
      this._installedBoards = new Deferred();
      // 获取已安装的开发板列表并在完成时处理延迟对象
      this.installedBoards().then((installedBoards) =>
        this._installedBoards?.resolve(installedBoards)
      );
    }
    // 获取已安装的开发板列表的承诺结果
    const installedBoards = await this._installedBoards.promise;
    // 根据已安装的开发板列表和当前开发板列表重建菜单
    this.rebuildMenus(installedBoards, this.boardsServiceProvider.boardList);
  }

  private rebuildMenus(
    installedBoards: InstalledBoardWithPackage[],
    boardList: BoardList
  ): void {
    // 清理在菜单重建前需要处理的可弃用对象集合
    this.toDisposeBeforeMenuRebuild.dispose();

    // Boards submenu
    const boardsSubmenuPath = [
      // ...ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP,
      '1_boards',
    ];
    const { selectedBoard, selectedPort } = boardList.boardsConfig;
    const boardsSubmenuLabel = selectedBoard?.name;
    // 注册开发板子菜单，并设置菜单标签和顺序
    this.menuModelRegistry.registerSubmenu(
      boardsSubmenuPath,
      nls.localize(
        'arduino/board/board',
        'Board{0}',
        !!boardsSubmenuLabel ? `: "${boardsSubmenuLabel}"` : ''
      ),
      { order: '100' }
    );
    // 将取消注册开发板子菜单的操作添加到可弃用对象集合中
    // this.toDisposeBeforeMenuRebuild.push(
    //   Disposable.create(() =>
    //     unregisterSubmenu(boardsSubmenuPath, this.menuModelRegistry)
    //   )
    // );

    // Ports submenu
    // const portsSubmenuPath = ArduinoMenus.TOOLS__PORTS_SUBMENU;
    const portsSubmenuLabel = selectedPort?.address;
    console.log('portsSubmenuLabel', portsSubmenuLabel);
    // 注册端口子菜单，并设置菜单标签和顺序
    // this.menuModelRegistry.registerSubmenu(
    //   portsSubmenuPath,
    //   nls.localize(
    //     'arduino/board/port',
    //     'Port{0}',
    //     portsSubmenuLabel ? `: "${portsSubmenuLabel}"` : ''
    //   ),
    //   { order: '101' }
    // );
    // 将取消注册端口子菜单的操作添加到可弃用对象集合中
    // this.toDisposeBeforeMenuRebuild.push(
    //   Disposable.create(() =>
    //     unregisterSubmenu(portsSubmenuPath, this.menuModelRegistry)
    //   )
    // );

    const reloadBoardData = {
      commandId: BoardSelection.Commands.RELOAD_BOARD_DATA.id,
      label: nls.localize('arduino/board/reloadBoardData', 'Reload Board Data'),
      order: '102',
    };
    this.menuModelRegistry.registerMenuAction(
      ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP,
      reloadBoardData
    );
    this.toDisposeBeforeMenuRebuild.push(
      Disposable.create(() =>
        this.menuModelRegistry.unregisterMenuAction(reloadBoardData)
      )
    );

    // const getBoardInfo = {
    //   commandId: BoardSelection.Commands.GET_BOARD_INFO.id,
    //   label: '获得开发板信息',
    //   order: '103',
    // };
    // 注册获取开发板信息的菜单动作
    // this.menuModelRegistry.registerMenuAction(
    //   ArduinoMenus.TOOLS__BOARD_SELECTION_GROUP,
    //   getBoardInfo
    // );
    // // 将取消注册获取开发板信息菜单动作的操作添加到可弃用对象集合中
    // this.toDisposeBeforeMenuRebuild.push(
    //   Disposable.create(() =>
    //     this.menuModelRegistry.unregisterMenuAction(getBoardInfo)
    //   )
    // );

    const boardsManagerGroup = [...boardsSubmenuPath, '0_manager'];
    const boardsPackagesGroup = [...boardsSubmenuPath, '1_packages']; //板子

    // 注册开发板管理的菜单动作
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
                `${manuallyInstalled ? '（在项目文件夹中）' : ''}`;
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
        // ...portsSubmenuPath,
        `${protocolOrder.toString()}_${protocol}`,
      ];

      const placeholder = new PlaceholderMenuNode(
        menuPath,
        // nls.localize(
        //   'arduino/board/typeOfPorts',
        //   '{0} 端口',
        //   Port.Protocols.protocolLabel(protocol)
        // ),
        '串口 端口',
        { order: protocolOrder.toString().padStart(4) }
      );
      // this.menuModelRegistry.registerMenuNode(menuPath, placeholder);
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
        this.toDisposeBeforeMenuRebuild.push(
          Disposable.create(() =>
            this.menuModelRegistry.unregisterMenuNode(menuAction.commandId)
          )
        );
      }
    };

    const groupedPorts = boardList.portsGroupedByProtocol();
    let protocolOrder = 100;
    Object.entries(groupedPorts).forEach(([protocol, ports]) => {
      registerPorts(protocol, ports, protocolOrder);
      protocolOrder += 100;
    });
    // 更新主菜单管理器
    this.mainMenuManager.update();
  }

  protected async installedBoards(): Promise<InstalledBoardWithPackage[]> {
    const allBoards = await this.boardsService.getInstalledBoards();
    return allBoards.filter(InstalledBoardWithPackage.is);
  }
}
export namespace BoardSelection {
  export namespace Commands {
    export const GET_BOARD_INFO: Command = { id: 'lingzhi-get-board-info' };
    export const RELOAD_BOARD_DATA: Command = {
      id: 'lingzhi-reload-board-data',
    };
  }
}
