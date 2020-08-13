import { inject, injectable } from 'inversify';
import { MenuPath, SubMenuOptions } from '@theia/core/lib/common/menu';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { OpenSketch } from './open-sketch';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { ExamplesService, ExampleContainer } from '../../common/protocol/examples-service';
import { SketchContribution, CommandRegistry, MenuModelRegistry } from './contribution';

@injectable()
export class Examples extends SketchContribution {

    @inject(MainMenuManager)
    protected readonly menuManager: MainMenuManager;

    @inject(ExamplesService)
    protected readonly examplesService: ExamplesService;

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    protected readonly toDisposeBeforeRegister = new DisposableCollection();

    onStart(): void {
        this.registerExamples(); // no `await`
    }

    protected async registerExamples() {
        let exampleContainer: ExampleContainer | undefined;
        try {
            exampleContainer = await this.examplesService.all();
        } catch (e) {
            console.error('Could not initialize built-in examples.', e);
        }
        if (!exampleContainer) {
            this.messageService.error('Could not initialize built-in examples.');
            return;
        }
        this.toDisposeBeforeRegister.dispose();
        this.registerRecursively(exampleContainer, ArduinoMenus.FILE__SKETCH_GROUP, this.toDisposeBeforeRegister, { order: '4' });
        this.menuManager.update();
    }

    registerRecursively(
        exampleContainer: ExampleContainer,
        menuPath: MenuPath,
        pushToDispose: DisposableCollection = new DisposableCollection(),
        options?: SubMenuOptions): void {

        const { label, sketches, children } = exampleContainer;
        const submenuPath = [...menuPath, label];
        // TODO: unregister submenu? https://github.com/eclipse-theia/theia/issues/7300
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
