import { NativeImage } from '@theia/core/electron-shared/electron';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MenuAction } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { SketchesError } from '../../common/protocol';
import { ConfigServiceClient } from '../config/config-service-client';
import { ArduinoMenus } from '../menu/arduino-menus';
import { NativeImageCache } from '../native-image-cache';
import { NotificationCenter } from '../notification-center';
import { CloudSketchContribution } from './cloud-contribution';
import { CommandRegistry, MenuModelRegistry, Sketch } from './contribution';
import { OpenSketch } from './open-sketch';

@injectable()
export class OpenRecentSketch extends CloudSketchContribution {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(NativeImageCache)
  private readonly imageCache: NativeImageCache;
  @inject(ConfigServiceClient)
  private readonly configServiceClient: ConfigServiceClient;

  private readonly toDispose = new DisposableCollection();
  private cloudImage: NativeImage | undefined;

  override onStart(): void {
    this.notificationCenter.onRecentSketchesDidChange(({ sketches }) =>
      this.refreshMenu(sketches)
    );
    this.imageCache
      .getImage('cloud')
      .then((image) => (this.cloudImage = image));
  }

  override async onReady(): Promise<void> {
    this.update();
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerSubmenu(
      ArduinoMenus.FILE__OPEN_RECENT_SUBMENU,
      nls.localize('arduino/sketch/openRecent', 'Open Recent'),
      { order: '2' }
    );
  }

  private update(forceUpdate?: boolean): void {
    this.sketchesService
      .recentlyOpenedSketches(forceUpdate)
      .then((sketches) => this.refreshMenu(sketches));
  }

  private refreshMenu(sketches: Sketch[]): void {
    this.register(sketches);
    this.menuManager.update();
  }

  private register(sketches: Sketch[]): void {
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
      const menuAction = this.assignImage(sketch, {
        commandId: command.id,
        label: sketch.name,
        order: String(order),
      });
      this.menuRegistry.registerMenuAction(
        ArduinoMenus.FILE__OPEN_RECENT_SUBMENU,
        menuAction
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

  private assignImage(sketch: Sketch, menuAction: MenuAction): MenuAction {
    if (this.cloudImage) {
      const dataDirUri = this.configServiceClient.tryGetDataDirUri();
      const isCloud = this.createFeatures.isCloud(sketch, dataDirUri);
      if (isCloud) {
        Object.assign(menuAction, { nativeImage: this.cloudImage });
      }
    }
    return menuAction;
  }
}
