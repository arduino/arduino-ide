import { inject, injectable } from 'inversify';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { SketchContribution, CommandRegistry, MenuModelRegistry, Sketch } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { NotificationCenter } from '../notification-center';
import { OpenSketch } from './open-sketch';

@injectable()
export class Sketchbook extends SketchContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    protected toDisposePerSketch = new Map<string, DisposableCollection>();

    onStart(): void {
        this.sketchService.getSketches().then(sketches => {
            this.register(sketches);
            this.mainMenuManager.update();
        });
        this.sketchServiceClient.onSketchbookDidChange(({ created, removed }) => {
            this.unregister(removed);
            this.register(created);
            this.mainMenuManager.update();
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(ArduinoMenus.FILE__SKETCHBOOK_SUBMENU, 'Sketchbook', { order: '3' });
    }

    protected register(sketches: Sketch[]): void {
        for (const sketch of sketches) {
            const { uri } = sketch;
            const toDispose = this.toDisposePerSketch.get(uri);
            if (toDispose) {
                toDispose.dispose();
            }
            const command = { id: `arduino-sketchbook-open--${uri}` };
            const handler = { execute: () => this.commandRegistry.executeCommand(OpenSketch.Commands.OPEN_SKETCH.id, sketch) };
            this.commandRegistry.registerCommand(command, handler);
            this.menuRegistry.registerMenuAction(ArduinoMenus.FILE__SKETCHBOOK_SUBMENU, { commandId: command.id, label: sketch.name });
            this.toDisposePerSketch.set(sketch.uri, new DisposableCollection(
                Disposable.create(() => this.commandRegistry.unregisterCommand(command)),
                Disposable.create(() => this.menuRegistry.unregisterMenuAction(command))
            ));
        }
    }

    protected unregister(sketches: Sketch[]): void {
        for (const { uri } of sketches) {
            const toDispose = this.toDisposePerSketch.get(uri);
            if (toDispose) {
                toDispose.dispose();
            }
        }
    }

}
