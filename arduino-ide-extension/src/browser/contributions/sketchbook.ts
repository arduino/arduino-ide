import { injectable } from '@theia/core/shared/inversify';
import { CommandHandler } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Examples } from './examples';
import { SketchContainer, SketchesError } from '../../common/protocol';
import { OpenSketch } from './open-sketch';
import { nls } from '@theia/core/lib/common/nls';

@injectable()
export class Sketchbook extends Examples {
  override onStart(): void {
    this.sketchServiceClient.onSketchbookDidChange(() => this.update());
    this.configService.onDidChangeSketchDirUri(() => this.update());
  }

  override async onReady(): Promise<void> {
    this.update();
  }

  protected override update(): void {
    this.sketchesService.getSketches({}).then((container) => {
      this.register(container);
      this.menuManager.update();
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(
      ArduinoMenus.FILE__SKETCHBOOK_SUBMENU,
      nls.localize('arduino/sketch/sketchbook', 'Sketchbook'),
      { order: '3' }
    );
  }

  private register(container: SketchContainer): void {
    this.toDispose.dispose();
    this.registerRecursively(
      [...container.children, ...container.sketches],
      ArduinoMenus.FILE__SKETCHBOOK_SUBMENU,
      this.toDispose
    );
  }

  protected override createHandler(uri: string): CommandHandler {
    return {
      execute: async () => {
        try {
          await this.commandService.executeCommand(
            OpenSketch.Commands.OPEN_SKETCH.id,
            uri
          );
        } catch (err) {
          if (SketchesError.NotFound.is(err)) {
            // Force update the menu items to remove the absent sketch.
            this.update();
          } else {
            throw err;
          }
        }
      },
    };
  }
}
