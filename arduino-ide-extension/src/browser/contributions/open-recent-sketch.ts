import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceServer } from '@theia/workspace/lib/common/workspace-protocol';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import {
  SketchContribution,
  CommandRegistry,
  MenuModelRegistry,
  Sketch,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { MainMenuManager } from '../../common/main-menu-manager';
import { OpenSketch } from './open-sketch';
import { NotificationCenter } from '../notification-center';
import { nls } from '@theia/core/lib/common';
import { SketchesError } from '../../common/protocol';

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

  protected toDispose = new DisposableCollection();

  override onStart(): void {
    this.notificationCenter.onRecentSketchesDidChange(({ sketches }) =>
      this.refreshMenu(sketches)
    );
  }

  override async onReady(): Promise<void> {
    this.update();
  }

  private update(forceUpdate?: boolean): void {
    this.sketchesService
      .recentlyOpenedSketches(forceUpdate)
      .then((sketches) => this.refreshMenu(sketches));
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(
      ArduinoMenus.FILE__OPEN_RECENT_SUBMENU,
      nls.localize('arduino/sketch/openRecent', 'Open Recent'),
      { order: '2' }
    );
  }

  private refreshMenu(sketches: Sketch[]): void {
    this.register(sketches);
    this.mainMenuManager.update();
  }

  protected register(sketches: Sketch[]): void {
    const order = 0;
    this.toDispose.dispose();
    for (const sketch of sketches) {
      const { uri } = sketch;
      const command = { id: `arduino-open-recent--${uri}` };
      const handler = {
        execute: async () => {
          try {
            await this.commandRegistry.executeCommand(
              OpenSketch.Commands.OPEN_SKETCH.id,
              sketch
            );
          } catch (err) {
            if (SketchesError.NotFound.is(err)) {
              this.update(true);
            } else {
              throw err;
            }
          }
        },
      };
      this.commandRegistry.registerCommand(command, handler);
      this.menuRegistry.registerMenuAction(
        ArduinoMenus.FILE__OPEN_RECENT_SUBMENU,
        {
          commandId: command.id,
          label: sketch.name,
          order: String(order),
        }
      );
      this.toDispose.pushAll([
        new DisposableCollection(
          Disposable.create(() =>
            this.commandRegistry.unregisterCommand(command)
          ),
          Disposable.create(() =>
            this.menuRegistry.unregisterMenuAction(command)
          )
        ),
      ]);
    }
  }
}
