import * as PQueue from 'p-queue';
import { inject, injectable, postConstruct } from 'inversify';
import { MenuPath, SubMenuOptions, CompositeMenuNode } from '@theia/core/lib/common/menu';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { OpenSketch } from './open-sketch';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ExamplesService, ExampleContainer } from '../../common/protocol/examples-service';
import { SketchContribution, CommandRegistry, MenuModelRegistry } from './contribution';
import { NotificationCenter } from '../notification-center';

@injectable()
export abstract class Examples extends SketchContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly menuManager: MainMenuManager;

    @inject(ExamplesService)
    protected readonly examplesService: ExamplesService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceClient: BoardsServiceProvider;

    protected readonly toDispose = new DisposableCollection();

    @postConstruct()
    init(): void {
        this.boardsServiceClient.onBoardsConfigChanged(({ selectedBoard }) => this.handleBoardChanged(selectedBoard?.fqbn));
    }

    protected handleBoardChanged(fqbn: string | undefined): void {
        // NOOP
    }

    registerMenus(registry: MenuModelRegistry): void {
        try {
            // This is a hack the ensures the desired menu ordering! We cannot use https://github.com/eclipse-theia/theia/pull/8377 due to ATL-222.
            const index = ArduinoMenus.FILE__EXAMPLES_SUBMENU.length - 1;
            const menuId = ArduinoMenus.FILE__EXAMPLES_SUBMENU[index];
            const groupPath = index === 0 ? [] : ArduinoMenus.FILE__EXAMPLES_SUBMENU.slice(0, index);
            const parent: CompositeMenuNode = (registry as any).findGroup(groupPath);
            const examples = new CompositeMenuNode(menuId, '', { order: '4' });
            parent.addNode(examples);
        } catch (e) {
            console.error(e);
            console.warn('Could not patch menu ordering.');
        }
        // Registering the same submenu multiple times has no side-effect.
        // TODO: unregister submenu? https://github.com/eclipse-theia/theia/issues/7300
        registry.registerSubmenu(ArduinoMenus.FILE__EXAMPLES_SUBMENU, 'Examples', { order: '4' });
    }

    registerRecursively(
        exampleContainer: ExampleContainer,
        menuPath: MenuPath,
        pushToDispose: DisposableCollection = new DisposableCollection(),
        options?: SubMenuOptions): void {

        const { label, sketches, children } = exampleContainer;
        const submenuPath = [...menuPath, label];
        this.menuRegistry.registerSubmenu(submenuPath, label, options);
        children.forEach(child => this.registerRecursively(child, submenuPath, pushToDispose));
        for (const sketch of sketches) {
            const { uri } = sketch;
            const commandId = `arduino-open-example-${submenuPath.join(':')}--${uri}`;
            const command = { id: commandId };
            const handler = {
                execute: async () => {
                    const sketch = await this.sketchService.cloneExample(uri);
                    this.commandService.executeCommand(OpenSketch.Commands.OPEN_SKETCH.id, sketch);
                }
            };
            pushToDispose.push(this.commandRegistry.registerCommand(command, handler));
            this.menuRegistry.registerMenuAction(submenuPath, { commandId, label: sketch.name });
            pushToDispose.push(Disposable.create(() => this.menuRegistry.unregisterMenuAction(command)));
        }
    }

}

@injectable()
export class BuiltInExamples extends Examples {

    onStart(): void {
        this.register(); // no `await`
    }

    protected async register() {
        let exampleContainers: ExampleContainer[] | undefined;
        try {
            exampleContainers = await this.examplesService.builtIns();
        } catch (e) {
            console.error('Could not initialize built-in examples.', e);
            this.messageService.error('Could not initialize built-in examples.');
            return;
        }
        this.toDispose.dispose();
        for (const container of exampleContainers) {
            this.registerRecursively(container, ArduinoMenus.EXAMPLES__BUILT_IN_GROUP, this.toDispose);
        }
        this.menuManager.update();
    }

}

@injectable()
export class LibraryExamples extends Examples {

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    protected readonly queue = new PQueue({ autoStart: true, concurrency: 1 });

    onStart(): void {
        this.register(); // no `await`
        this.notificationCenter.onLibraryInstalled(() => this.register());
        this.notificationCenter.onLibraryUninstalled(() => this.register());
    }

    protected handleBoardChanged(fqbn: string | undefined): void {
        this.register(fqbn);
    }

    protected async register(fqbn: string | undefined = this.boardsServiceClient.boardsConfig.selectedBoard?.fqbn) {
        return this.queue.add(async () => {
            this.toDispose.dispose();
            if (!fqbn) {
                return;
            }
            const { user, current, any } = await this.examplesService.installed({ fqbn });
            for (const container of user) {
                this.registerRecursively(container, ArduinoMenus.EXAMPLES__USER_LIBS_GROUP, this.toDispose);
            }
            for (const container of current) {
                this.registerRecursively(container, ArduinoMenus.EXAMPLES__CURRENT_BOARD_GROUP, this.toDispose);
            }
            for (const container of any) {
                this.registerRecursively(container, ArduinoMenus.EXAMPLES__ANY_BOARD_GROUP, this.toDispose);
            }
            this.menuManager.update();
        });
    }

}
