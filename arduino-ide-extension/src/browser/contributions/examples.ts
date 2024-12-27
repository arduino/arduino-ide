import PQueue from 'p-queue';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandHandler, CommandService } from '@theia/core/lib/common/command';
import { MenuPath, SubMenuOptions } from '@theia/core/lib/common/menu';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { OpenSketch } from './open-sketch';
import { ArduinoMenus, PlaceholderMenuNode } from '../menu/arduino-menus';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ExamplesService } from '../../common/protocol/examples-service';
import {
  SketchContribution,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { NotificationCenter } from '../notification-center';
import {
  Board,
  SketchRef,
  SketchContainer,
  SketchesError,
  CoreService,
  SketchesService,
  Sketch,
  isBoardIdentifierChangeEvent,
  BoardIdentifier,
  ResponseService,
} from '../../common/protocol';
import { nls } from '@theia/core/lib/common/nls';
import { unregisterSubmenu } from '../menu/arduino-menus';
import { MaybePromise } from '@theia/core/lib/common/types';
import { ApplicationError } from '@theia/core/lib/common/application-error';
/**
 * 创建示例草图的克隆副本，并在新窗口中打开它。
 */
export async function openClonedExample(
  uri: string,
  services: {
    sketchesService: SketchesService;
    commandService: CommandService;
  },
  onError: {
    onDidFailClone?: (
      err: ApplicationError<
        number,
        {
          uri: string;
        }
      >,
      uri: string
    ) => MaybePromise<unknown>;
    onDidFailOpen?: (
      err: ApplicationError<
        number,
        {
          uri: string;
        }
      >,
      sketch: Sketch
    ) => MaybePromise<unknown>;
  } = {}
): Promise<void> {
  const { sketchesService, commandService } = services;
  const { onDidFailClone, onDidFailOpen } = onError;
  try {
    // 尝试克隆示例草图
    const sketch = await sketchesService.cloneExample(uri);
    try {
      // 执行打开草图的命令
      await commandService.executeCommand(
        OpenSketch.Commands.OPEN_SKETCH.id,
        sketch,
        uri
      );
    } catch (openError) {
      // 如果打开失败且是因为草图未找到
      if (SketchesError.NotFound.is(openError)) {
        if (onDidFailOpen) {
          // 执行自定义的打开失败处理逻辑
          await onDidFailOpen(openError, sketch);
          return;
        }
      }
      throw openError;
    }
  } catch (cloneError) {
    // 如果克隆失败且是因为草图未找到
    if (SketchesError.NotFound.is(cloneError)) {
      if (onDidFailClone) {
        // 执行自定义的克隆失败处理逻辑
        await onDidFailClone(cloneError, uri);
        return;
      }
    }
    throw cloneError;
  }
}

@injectable()
export abstract class Examples extends SketchContribution {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(ExamplesService)
  protected readonly examplesService: ExamplesService;

  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;

  @inject(ResponseService)
  public readonly responseService: ResponseService;

  protected readonly toDispose = new DisposableCollection();

  protected override init(): void {
    super.init();
    // 监听电路板配置变化事件
    this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
      if (isBoardIdentifierChangeEvent(event)) {
        this.handleBoardChanged(event.selectedBoard);
      }
    });
    // 监听重新初始化事件，进行更新
    this.notificationCenter.onDidReinitialize(() =>
      this.update({
        board: this.boardsServiceProvider.boardsConfig.selectedBoard,
        // No force refresh. The core client was already refreshed.
      })
    );
  }

  // 处理电路板变化的抽象方法，默认不执行任何操作
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  protected handleBoardChanged(board: Board | undefined): void {
    // NOOP
  }

  protected abstract update(options?: {
    board?: BoardIdentifier | undefined;
    forceRefresh?: boolean;
  }): void;

  // override registerMenus(registry: MenuModelRegistry): void {
  //   // 注册子菜单
  //   registry.registerSubmenu(
  //     ArduinoMenus.FILE__EXAMPLES_SUBMENU, // 注册子菜单的路径
  //     examplesLabel, // 子菜单的标签
  //     {
  //       order: '4', // 子菜单的显示顺序
  //     }
  //   );
  // }

  registerRecursively(
    sketchContainerOrPlaceholder:
      | SketchContainer
      | (SketchRef | SketchContainer)[]
      | string,
    menuPath: MenuPath,
    pushToDispose: DisposableCollection = new DisposableCollection(),
    subMenuOptions?: SubMenuOptions | undefined
  ): void {
    if (typeof sketchContainerOrPlaceholder === 'string') {
      // 如果传入的是字符串，创建占位节点并注册
      const placeholder = new PlaceholderMenuNode(
        menuPath,
        sketchContainerOrPlaceholder
      );
      this.menuRegistry.registerMenuNode(menuPath, placeholder);
      pushToDispose.push(
        Disposable.create(() =>
          this.menuRegistry.unregisterMenuNode(placeholder.id)
        )
      );
    } else {
      const sketches: SketchRef[] = [];
      const children: SketchContainer[] = [];
      let submenuPath = menuPath;

      if (SketchContainer.is(sketchContainerOrPlaceholder)) {
        // 如果传入的是 SketchContainer 类型，处理并注册子菜单
        const { label } = sketchContainerOrPlaceholder;
        submenuPath = [...menuPath, label];
        this.menuRegistry.registerSubmenu(submenuPath, label, subMenuOptions);
        this.toDispose.push(
          Disposable.create(() =>
            unregisterSubmenu(submenuPath, this.menuRegistry)
          )
        );
        sketches.push(...sketchContainerOrPlaceholder.sketches);
        children.push(...sketchContainerOrPlaceholder.children);
      } else {
        // 如果传入的是数组类型，遍历分类并处理
        for (const sketchOrContainer of sketchContainerOrPlaceholder) {
          if (SketchContainer.is(sketchOrContainer)) {
            children.push(sketchOrContainer);
          } else {
            sketches.push(sketchOrContainer);
          }
        }
      }

      // 递归注册子菜单和动作
      children.forEach((child) =>
        this.registerRecursively(child, submenuPath, pushToDispose)
      );
      for (const sketch of sketches) {
        const { uri } = sketch;
        const commandId = `arduino-open-example-${submenuPath.join(
          ':'
        )}--${uri}`;
        const command = { id: commandId };
        const handler = this.createHandler(uri);
        pushToDispose.push(
          this.commandRegistry.registerCommand(command, {
            execute: () => {
              const today = new Date();
              // localStorage.setItem(
              //   'arduino-new-sketch-executedB',
              //   today.toLocaleString()
              // );
              localStorage.setItem(
                'lingzhi-open-sketch-view',
                today.toLocaleString()
              );
              return handler.execute();
            },
          })
          // this.commandRegistry.registerCommand(command, handler)
        );
        // 注册菜单动作
        this.menuRegistry.registerMenuAction(submenuPath, {
          commandId,
          label: sketch.name,
          order: sketch.name.toLocaleLowerCase(),
        });
        pushToDispose.push(
          Disposable.create(() =>
            this.menuRegistry.unregisterMenuAction(command)
          )
        );
      }
    }
  }

  protected createHandler(uri: string): CommandHandler {
    // 定义一个强制更新的函数，用于更新某些状态
    const forceUpdate = () =>
      this.update({
        board: this.boardsServiceProvider.boardsConfig.selectedBoard,
        forceRefresh: true,
      });
    return {
      // 命令执行函数
      execute: async () => {
        // 等待打开克隆后的示例的操作
        await openClonedExample(
          uri,
          {
            sketchesService: this.sketchesService,
            commandService: this.commandRegistry,
          },
          {
            // 当克隆失败时的回调函数
            onDidFailClone: () => {
              // 克隆失败处理，不显示错误消息，由打开草图命令处理
              forceUpdate();
            },
            // 当打开失败时的回调函数
            onDidFailOpen: (err) => {
              // this.messageService.error(err.message);
              const chunk = `${err.message}\n`;
              this.responseService.appendToOutput({ chunk });
              forceUpdate();
            },
          }
        );
      },
    };
  }
}

@injectable()
export class BuiltInExamples extends Examples {
  override async onReady(): Promise<void> {
    this.update(); // no `await`
  }

  protected override async update(): Promise<void> {
    let sketchContainers: SketchContainer[] | undefined;
    try {
      // 获取内置示例草图容器
      sketchContainers = await this.examplesService.builtIns();
    } catch (e) {
      console.error('Could not initialize built-in examples.', e);
      // 显示错误消息
      // this.messageService.error(
      //   nls.localize(
      //     'arduino/examples/couldNotInitializeExamples',
      //     '无法初始化内置示例。'
      //   )
      // );
      const chunk = `无法初始化内置示例\n`;
      this.responseService.appendToOutput({ chunk });
      return;
    }
    this.toDispose.dispose();
    for (const container of [
      nls.localize('arduino/examples/builtInExamples', '内置的例子'),
      ...sketchContainers,
    ]) {
      // 递归注册内置示例草图容器
      this.registerRecursively(
        container,
        ArduinoMenus.EXAMPLES__BUILT_IN_GROUP,
        this.toDispose
      );
    }
    this.menuManager.update();
  }
}

@injectable()
export class LibraryExamples extends Examples {
  private readonly queue = new PQueue({ autoStart: true, concurrency: 1 });

  override onStart(): void {
    // 监听库安装和卸载事件，进行更新
    this.notificationCenter.onLibraryDidInstall(() => this.update());
    this.notificationCenter.onLibraryDidUninstall(() => this.update());
  }

  override onReady(): void {
    // 当电路板服务准备好时更新
    this.boardsServiceProvider.ready.then(() => this.update());
  }

  protected override handleBoardChanged(board: Board | undefined): void {
    this.update({ board });
  }

  protected override async update(
    options: { board?: Board; forceRefresh?: boolean } = {
      board: this.boardsServiceProvider.boardsConfig.selectedBoard,
    }
  ): Promise<void> {
    const { board, forceRefresh } = options;
    return this.queue.add(async () => {
      this.toDispose.dispose();
      if (forceRefresh) {
        await this.coreService.refresh();
      }
      const fqbn = board?.fqbn;
      const name = board?.name;
      // 获取不同类型的示例草图容器
      const { user, current, any } = await this.examplesService.installed({
        fqbn,
      });
      if (user.length) {
        (user as any).unshift(
          nls.localize(
            'arduino/examples/customLibrary',
            'Examples from Custom Libraries'
          )
        );
      }
      if (name && fqbn && current.length) {
        (current as any).unshift(
          nls.localize('arduino/examples/for', 'Examples for {0}', name)
        );
      }
      if (any.length) {
        (any as any).unshift(
          nls.localize('arduino/examples/forAny', 'Examples for any board')
        );
      }
      for (const container of user) {
        // 递归注册用户库示例草图容器
        this.registerRecursively(
          container,
          ArduinoMenus.EXAMPLES__USER_LIBS_GROUP,
          this.toDispose
        );
      }
      for (const container of current) {
        // 递归注册当前电路板示例草图容器
        this.registerRecursively(
          container,
          ArduinoMenus.EXAMPLES__CURRENT_BOARD_GROUP,
          this.toDispose
        );
      }
      for (const container of any) {
        // 递归注册任意电路板示例草图容器
        this.registerRecursively(
          container,
          ArduinoMenus.EXAMPLES__ANY_BOARD_GROUP,
          this.toDispose
        );
      }
      this.menuManager.update();
    });
  }
}
