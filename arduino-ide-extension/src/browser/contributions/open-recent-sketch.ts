import { inject, injectable } from 'inversify';
import { WorkspaceServer } from '@theia/workspace/lib/common/workspace-protocol';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { SketchContribution, CommandRegistry, MenuModelRegistry, Sketch } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { OpenSketch } from './open-sketch';
import { NotificationCenter } from '../notification-center';

@injectable()
export class OpenRecentSketch extends SketchContribution {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(MenuModelRegistry)
    protected readonly menuRegistry: MenuModelRegistry;

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(WorkspaceServer)
    protected readonly workspaceServer: WorkspaceServer;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    protected toDisposeBeforeRegister = new Map<string, DisposableCollection>();

    onStart(): void {
        const refreshMenu = (sketches: Sketch[]) => {
            this.register(sketches);
            this.mainMenuManager.update();
        };
        this.notificationCenter.onRecentSketchesChanged(({ sketches }) => refreshMenu(sketches));
        this.sketchService.recentlyOpenedSketches().then(refreshMenu);
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerSubmenu(ArduinoMenus.FILE__OPEN_RECENT_SUBMENU, 'Open Recent', { order: '2' });
    }

    protected register(sketches: Sketch[]): void {
        let order = 0;
        for (const sketch of sketches) {
            const { uri } = sketch;
            const toDispose = this.toDisposeBeforeRegister.get(uri);
            if (toDispose) {
                toDispose.dispose();
            }
            const command = { id: `arduino-open-recent--${uri}` };
            const handler = { execute: () => this.commandRegistry.executeCommand(OpenSketch.Commands.OPEN_SKETCH.id, sketch) };
            this.commandRegistry.registerCommand(command, handler);
            this.menuRegistry.registerMenuAction(ArduinoMenus.FILE__OPEN_RECENT_SUBMENU, { commandId: command.id, label: sketch.name, order: String(order) });
            this.toDisposeBeforeRegister.set(sketch.uri, new DisposableCollection(
                Disposable.create(() => this.commandRegistry.unregisterCommand(command)),
                Disposable.create(() => this.menuRegistry.unregisterMenuAction(command))
            ));
        }
    }

}
