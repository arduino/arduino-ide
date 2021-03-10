import { inject, injectable } from 'inversify';
import { CommandRegistry, MenuModelRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { NotificationCenter } from '../notification-center';
import { Examples } from './examples';
import { SketchContainer } from '../../common/protocol';

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

}
