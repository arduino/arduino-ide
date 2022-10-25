import { inject, injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { isOSX } from '@theia/core/lib/common/os';
import {
  ActionMenuNode,
  CompositeMenuNode,
  MAIN_MENU_BAR,
  MenuNode,
  MenuPath,
} from '@theia/core/lib/common/menu';
import {
  ElectronMainMenuFactory as TheiaElectronMainMenuFactory,
  ElectronMenuItemRole,
  ElectronMenuOptions,
} from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import {
  ArduinoMenus,
  PlaceholderMenuNode,
} from '../../../browser/menu/arduino-menus';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class ElectronMainMenuFactory extends TheiaElectronMainMenuFactory {
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private appReady = false;
  private updateWhenReady = false;

  override postConstruct(): void {
    super.postConstruct();
    this.appStateService.reachedState('ready').then(() => {
      this.appReady = true;
      if (this.updateWhenReady) {
        this.setMenuBar();
      }
    });
  }

  override createElectronMenuBar(): Electron.Menu {
    this._toggledCommands.clear(); // https://github.com/eclipse-theia/theia/issues/8977
    const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
    const template = this.fillMenuTemplate([], menuModel);
    if (isOSX) {
      template.unshift(this.createOSXMenu());
    }
    const menu = remote.Menu.buildFromTemplate(this.escapeAmpersand(template));
    this._menu = menu;
    return menu;
  }

  override async setMenuBar(): Promise<void> {
    // Avoid updating menu items when the app is not ready.
    // Getting the current electron window is not free and synchronous.
    // Here, we defer all menu update requests, and fire one when the app is ready.
    if (!this.appReady) {
      this.updateWhenReady = true;
      return;
    }
    await this.preferencesService.ready;
    const createdMenuBar = this.createElectronMenuBar();
    if (isOSX) {
      remote.Menu.setApplicationMenu(createdMenuBar);
    } else {
      remote.getCurrentWindow().setMenu(createdMenuBar);
    }
  }

  override createElectronContextMenu(
    menuPath: MenuPath,
    args?: any[]
  ): Electron.Menu {
    const menuModel = this.menuProvider.getMenu(menuPath);
    const template = this.fillMenuTemplate([], menuModel, args, {
      showDisabled: false,
    });
    return remote.Menu.buildFromTemplate(this.escapeAmpersand(template));
  }

  // TODO: remove after https://github.com/eclipse-theia/theia/pull/9231
  private escapeAmpersand(
    template: Electron.MenuItemConstructorOptions[]
  ): Electron.MenuItemConstructorOptions[] {
    for (const option of template) {
      if (option.label) {
        option.label = option.label.replace(/\&+/g, '&$&');
      }
      if (option.submenu) {
        this.escapeAmpersand(
          option.submenu as Electron.MenuItemConstructorOptions[]
        );
      }
    }
    return template;
  }

  protected override createOSXMenu(): Electron.MenuItemConstructorOptions {
    const { submenu } = super.createOSXMenu();
    const label = 'Arduino IDE';
    if (!!submenu && Array.isArray(submenu)) {
      const [, , /* about */ /* preferences */ ...rest] = submenu;
      const about = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.HELP__ABOUT_GROUP)
      );
      const preferences = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.FILE__PREFERENCES_GROUP)
      );
      const advanced = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.FILE__ADVANCED_GROUP)
      );
      return {
        label,
        submenu: [
          ...about,
          { type: 'separator' },
          ...preferences,
          ...advanced,
          { type: 'separator' },
          ...rest,
        ],
      };
    }
    return { label, submenu };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override roleFor(id: string): ElectronMenuItemRole | undefined {
    // MenuItem `roles` are completely broken on macOS:
    //  - https://github.com/eclipse-theia/theia/issues/11217,
    //  - https://github.com/arduino/arduino-ide/issues/969
    // IDE2 uses commands instead.
    return undefined;
  }

  protected override handleElectronDefault(
    menuNode: MenuNode,
    args: any[] = [],
    options?: ElectronMenuOptions
  ): Electron.MenuItemConstructorOptions[] {
    if (menuNode instanceof PlaceholderMenuNode) {
      return [
        {
          label: menuNode.label,
          enabled: false,
          visible: true,
        },
      ];
    }
    return [];
  }

  // Copied from 1.25.0 Theia as is to customize the enablement of the menu items.
  // Source: https://github.com/eclipse-theia/theia/blob/ca417a31e402bd35717d3314bf6254049d1dae44/packages/core/src/electron-browser/menu/electron-main-menu-factory.ts#L125-L220
  // See https://github.com/arduino/arduino-ide/issues/1533
  protected override fillMenuTemplate(
    items: Electron.MenuItemConstructorOptions[],
    menuModel: CompositeMenuNode,
    args: any[] = [],
    options?: ElectronMenuOptions
  ): Electron.MenuItemConstructorOptions[] {
    const showDisabled =
      options?.showDisabled === undefined ? true : options?.showDisabled;
    for (const menu of menuModel.children) {
      if (menu instanceof CompositeMenuNode) {
        if (menu.children.length > 0) {
          // do not render empty nodes

          if (menu.isSubmenu) {
            // submenu node

            const submenu = this.fillMenuTemplate([], menu, args, options);
            if (submenu.length === 0) {
              continue;
            }

            items.push({
              label: menu.label,
              submenu,
            });
          } else {
            // group node

            // process children
            const submenu = this.fillMenuTemplate([], menu, args, options);
            if (submenu.length === 0) {
              continue;
            }

            if (items.length > 0) {
              // do not put a separator above the first group

              items.push({
                type: 'separator',
              });
            }

            // render children
            items.push(...submenu);
          }
        }
      } else if (menu instanceof ActionMenuNode) {
        const node =
          menu.altNode && this.context.altPressed ? menu.altNode : menu;
        const commandId = node.action.commandId;

        // That is only a sanity check at application startup.
        if (!this.commandRegistry.getCommand(commandId)) {
          console.debug(
            `Skipping menu item with missing command: "${commandId}".`
          );
          continue;
        }

        if (
          !this.commandRegistry.isVisible(commandId, ...args) ||
          (!!node.action.when &&
            !this.contextKeyService.match(node.action.when))
        ) {
          continue;
        }

        // We should omit rendering context-menu items which are disabled.
        if (
          !showDisabled &&
          !this.commandRegistry.isEnabled(commandId, ...args)
        ) {
          continue;
        }

        const bindings =
          this.keybindingRegistry.getKeybindingsForCommand(commandId);

        const accelerator = bindings[0] && this.acceleratorFor(bindings[0]);

        const menuItem: Electron.MenuItemConstructorOptions = {
          id: node.id,
          label: node.label,
          type: this.commandRegistry.getToggledHandler(commandId, ...args)
            ? 'checkbox'
            : 'normal',
          checked: this.commandRegistry.isToggled(commandId, ...args),
          enabled: this.commandRegistry.isEnabled(commandId, ...args), // Unlike Theia https://github.com/eclipse-theia/theia/blob/ca417a31e402bd35717d3314bf6254049d1dae44/packages/core/src/electron-browser/menu/electron-main-menu-factory.ts#L197
          visible: true,
          accelerator,
          click: () => this.execute(commandId, args),
        };

        if (isOSX) {
          const role = this.roleFor(node.id);
          if (role) {
            menuItem.role = role;
            delete menuItem.click;
          }
        }
        items.push(menuItem);

        if (this.commandRegistry.getToggledHandler(commandId, ...args)) {
          this._toggledCommands.add(commandId);
        }
      } else {
        items.push(...this.handleElectronDefault(menu, args, options));
      }
    }
    return items;
  }
}
