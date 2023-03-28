import { NativeImage } from '@theia/core/electron-shared/electron';
import { ThemeService } from '@theia/core/lib/browser/theming';
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
import {
  isThemeNativeImage,
  NativeImageCache,
  ThemeNativeImage,
} from '../native-image-cache';
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
  @inject(ThemeService)
  private readonly themeService: ThemeService;

  private readonly toDisposeBeforeRegister = new DisposableCollection();
  private readonly toDispose = new DisposableCollection(
    this.toDisposeBeforeRegister
  );
  private cloudImage: NativeImage | ThemeNativeImage;

  override onStart(): void {
    this.toDispose.pushAll([
      this.notificationCenter.onRecentSketchesDidChange(({ sketches }) =>
        this.refreshMenu(sketches)
      ),
      this.themeService.onDidColorThemeChange(() => this.update()),
    ]);
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  override async onReady(): Promise<void> {
    this.update();
    this.imageCache.getImage('cloud').then((image) => {
      this.cloudImage = image;
      this.update();
    });
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
    this.toDisposeBeforeRegister.dispose();
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
      this.toDisposeBeforeRegister.pushAll([
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
    const image = this.nativeImageForTheme();
    if (image) {
      const dataDirUri = this.configServiceClient.tryGetDataDirUri();
      const isCloud = this.createFeatures.isCloud(sketch, dataDirUri);
      if (isCloud) {
        Object.assign(menuAction, { nativeImage: image });
      }
    }
    return menuAction;
  }

  private nativeImageForTheme(): NativeImage | undefined {
    const image = this.cloudImage;
    if (isThemeNativeImage(image)) {
      const themeType = this.themeService.getCurrentTheme().type;
      return themeType === 'light' ? image.light : image.dark;
    }
    return image;
  }
}
