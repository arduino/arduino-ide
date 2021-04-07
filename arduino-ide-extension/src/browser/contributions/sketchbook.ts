import { inject, injectable } from 'inversify';
import { CommandHandler } from '@theia/core/lib/common/command';
import { CommandRegistry, MenuModelRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { NotificationCenter } from '../notification-center';
import { Examples } from './examples';
import { SketchContainer } from '../../common/protocol';
import { OpenSketch } from './open-sketch';

@injectable()
export class Sketchbook extends Examples {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    onStart(): void {
        this.sketchService.getSketches({}).then(container => {
            this.register(container);
            this.mainMenuManager.update();
        });
        this.sketchServiceClient.onSketchbookDidChange(() => {
            this.sketchService.getSketches({}).then(container => {
                this.register(container);
                this.mainMenuManager.update();
            });
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(ArduinoMenus.FILE__SKETCHBOOK_SUBMENU, 'Sketchbook', { order: '3' });
    }

    protected register(container: SketchContainer): void {
        this.toDispose.dispose();
        this.registerRecursively([...container.children, ...container.sketches], ArduinoMenus.FILE__SKETCHBOOK_SUBMENU, this.toDispose);
    }

    protected createHandler(uri: string): CommandHandler {
        return {
            execute: async () => {
                const sketch = await this.sketchService.loadSketch(uri);
                return this.commandService.executeCommand(OpenSketch.Commands.OPEN_SKETCH.id, sketch);
            }
        }
    }

}
