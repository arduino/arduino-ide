import { ContextMatcher } from '@theia/core/lib/browser/context-key-service';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  CommandMenuNode,
  CompoundMenuNode,
  CompoundMenuNodeRole,
  MAIN_MENU_BAR,
  MenuNode,
  MenuPath,
} from '@theia/core/lib/common/menu';
import { isOSX } from '@theia/core/lib/common/os';
import {
  ElectronMenuOptions,
  ElectronMainMenuFactory as TheiaElectronMainMenuFactory,
} from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import type {
  MenuDto,
  MenuRole,
} from '@theia/core/lib/electron-common/electron-api';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  ArduinoMenus,
  PlaceholderMenuNode,
} from '../../../browser/menu/arduino-menus';
import debounce from 'lodash.debounce';

@injectable()
export class ElectronMainMenuFactory extends TheiaElectronMainMenuFactory {
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private appReady = false;
  private updateWhenReady = false;

  override postConstruct(): void {
    // #region Theia `postConstruct` customizations with calling IDE2 `setMenu`
    this.preferencesService.onPreferenceChanged(
      debounce((e) => {
        if (e.preferenceName === 'window.menuBarVisibility') {
          this.doSetMenuBar();
        }
        if (this.menu) {
          for (const cmd of this.toggledCommands) {
            const menuItem = this.findMenuById(this.menu, cmd);
            if (menuItem) {
              menuItem.checked = this.commandRegistry.isToggled(cmd);
            }
          }
          window.electronArduino.setMenu(this.menu); // calls the IDE2-specific implementation
        }
      }, 10)
    );
    this.keybindingRegistry.onKeybindingsChanged(() => {
      this.doSetMenuBar();
    });
    // #endregion Theia `postConstruct`
    this.appStateService.reachedState('ready').then(() => {
      this.appReady = true;
      if (this.updateWhenReady) {
        this.doSetMenuBar();
      }
    });
  }

  override createElectronMenuBar(): MenuDto[] {
    this.toggledCommands.clear(); // https://github.com/eclipse-theia/theia/issues/8977
    const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
    const menu = this.fillMenuTemplate([], menuModel, [], {
      rootMenuPath: MAIN_MENU_BAR,
    });
    if (isOSX) {
      menu.unshift(this.createOSXMenu());
    }
    const escapedMenu = this.escapeAmpersand(menu);
    this.menu = escapedMenu;
    return escapedMenu;
  }

  override async doSetMenuBar(): Promise<void> {
    // Avoid updating menu items when the app is not ready.
    // Getting the current electron window is not free and synchronous.
    // Here, we defer all menu update requests, and fire one when the app is ready.
    if (!this.appReady) {
      this.updateWhenReady = true;
      return;
    }
    await this.preferencesService.ready;
    const createdMenuBar = this.createElectronMenuBar();
    window.electronArduino.setMenu(createdMenuBar);
  }

  override createElectronContextMenu(
    menuPath: MenuPath,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any[],
    context?: HTMLElement,
    contextKeyService?: ContextMatcher,
    showDisabled?: boolean
  ): MenuDto[] {
    const menuModel = this.menuProvider.getMenu(menuPath);
    return this.fillMenuTemplate([], menuModel, args, {
      showDisabled,
      context,
      rootMenuPath: menuPath,
      contextKeyService,
    });
  }

  protected override async execute(
    commandId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[],
    menuPath: MenuPath
  ): Promise<void> {
    try {
      // This is workaround for https://github.com/eclipse-theia/theia/issues/446.
      // Electron menus do not update based on the `isEnabled`, `isVisible` property of the command.
      // We need to check if we can execute it.
      if (this.menuCommandExecutor.isEnabled(menuPath, commandId, ...args)) {
        await this.menuCommandExecutor.executeCommand(
          menuPath,
          commandId,
          ...args
        );
        if (
          this.menu &&
          this.menuCommandExecutor.isVisible(menuPath, commandId, ...args)
        ) {
          const item = this.findMenuById(this.menu, commandId);
          if (item) {
            item.checked = this.menuCommandExecutor.isToggled(
              menuPath,
              commandId,
              ...args
            );
            window.electronArduino.setMenu(this.menu); // overridden to call the IDE2-specific implementation.
          }
        }
      }
    } catch {
      // no-op
    }
  }

  // TODO: remove after https://github.com/eclipse-theia/theia/pull/9231
  private escapeAmpersand(template: MenuDto[]): MenuDto[] {
    for (const option of template) {
      if (option.label) {
        option.label = option.label.replace(/\&+/g, '&$&');
      }
      if (option.submenu) {
        this.escapeAmpersand(option.submenu);
      }
    }
    return template;
  }

  protected override createOSXMenu(): MenuDto {
    const { submenu } = super.createOSXMenu();
    const label = FrontendApplicationConfigProvider.get().applicationName;
    if (!!submenu && Array.isArray(submenu)) {
      const [, , /* about */ /* preferences */ ...rest] = submenu;
      const about = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.HELP__ABOUT_GROUP),
        [],
        { rootMenuPath: ArduinoMenus.HELP__ABOUT_GROUP }
      );
      const preferences = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.FILE__PREFERENCES_GROUP),
        [],
        { rootMenuPath: ArduinoMenus.FILE__PREFERENCES_GROUP }
      );
      const advanced = this.fillMenuTemplate(
        [],
        this.menuProvider.getMenu(ArduinoMenus.FILE__ADVANCED_GROUP),
        [],
        { rootMenuPath: ArduinoMenus.FILE__ADVANCED_GROUP }
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  protected override roleFor(id: string): MenuRole | undefined {
    // MenuItem `roles` are completely broken on macOS:
    //  - https://github.com/eclipse-theia/theia/issues/11217,
    //  - https://github.com/arduino/arduino-ide/issues/969
    // IDE2 uses commands instead.
    return undefined;
  }

  protected override fillMenuTemplate(
    parentItems: MenuDto[],
    menuModel: MenuNode,
    args: unknown[] | undefined,
    options: ElectronMenuOptions
  ): MenuDto[] {
    if (menuModel instanceof PlaceholderMenuNode) {
      parentItems.push({
        label: menuModel.label,
        enabled: false,
        visible: true,
      });
    } else {
      this.superFillMenuTemplate(parentItems, menuModel, args, options);
    }
    return parentItems;
  }

  // Copied from 1.31.1 Theia as is to customize the enablement of the menu items.
  // Source: https://github.com/eclipse-theia/theia/blob/5e641750af83383f2ce0cb3432ec333df70778a8/packages/core/src/electron-browser/menu/electron-main-menu-factory.ts#L132-L203
  // See https://github.com/arduino/arduino-ide/issues/1533
  private superFillMenuTemplate(
    parentItems: MenuDto[],
    menu: MenuNode,
    args: unknown[] = [],
    options: ElectronMenuOptions
  ): MenuDto[] {
    const showDisabled = options?.showDisabled !== false;

    if (
      CompoundMenuNode.is(menu) &&
      this.visibleSubmenu(menu) && // customization for #569 and #655
      this.undefinedOrMatch(
        options.contextKeyService ?? this.contextKeyService,
        menu.when,
        options.context
      )
    ) {
      const role = CompoundMenuNode.getRole(menu);
      if (role === CompoundMenuNodeRole.Group && menu.id === 'inline') {
        return parentItems;
      }
      const children = CompoundMenuNode.getFlatChildren(menu.children);
      const myItems: MenuDto[] = [];
      children.forEach((child) =>
        this.fillMenuTemplate(myItems, child, args, options)
      );
      if (myItems.length === 0) {
        // customization for #569 and #655
        if (!this.visibleLeafSubmenu(menu)) {
          return parentItems;
        }
      }
      if (role === CompoundMenuNodeRole.Submenu) {
        parentItems.push({
          label: menu.label,
          submenu: myItems,
          enabled: !this.visibleLeafSubmenu(menu), // customization for #569 and #655
        });
      } else if (role === CompoundMenuNodeRole.Group && menu.id !== 'inline') {
        if (
          parentItems.length &&
          parentItems[parentItems.length - 1].type !== 'separator'
        ) {
          parentItems.push({ type: 'separator' });
        }
        parentItems.push(...myItems);
        parentItems.push({ type: 'separator' });
      }
    } else if (menu.command) {
      const node =
        menu.altNode && this.context.altPressed
          ? menu.altNode
          : (menu as MenuNode & CommandMenuNode);
      const commandId = node.command;

      // That is only a sanity check at application startup.
      if (!this.commandRegistry.getCommand(commandId)) {
        console.debug(
          `Skipping menu item with missing command: "${commandId}".`
        );
        return parentItems;
      }

      if (
        !this.menuCommandExecutor.isVisible(
          options.rootMenuPath,
          commandId,
          ...args
        ) ||
        !this.undefinedOrMatch(
          options.contextKeyService ?? this.contextKeyService,
          node.when,
          options.context
        )
      ) {
        return parentItems;
      }

      // We should omit rendering context-menu items which are disabled.
      if (
        !showDisabled &&
        !this.menuCommandExecutor.isEnabled(
          options.rootMenuPath,
          commandId,
          ...args
        )
      ) {
        return parentItems;
      }

      const bindings =
        this.keybindingRegistry.getKeybindingsForCommand(commandId);

      const accelerator = bindings[0] && this.acceleratorFor(bindings[0]);

      const menuItem: MenuDto = {
        id: node.id,
        label: node.label,
        type: this.commandRegistry.getToggledHandler(commandId, ...args)
          ? 'checkbox'
          : 'normal',
        checked: this.commandRegistry.isToggled(commandId, ...args),
        enabled: this.commandRegistry.isEnabled(commandId, ...args), // Unlike Theia https://github.com/eclipse-theia/theia/blob/v1.31.1/packages/core/src/electron-browser/menu/electron-main-menu-factory.ts#L183
        visible: true,
        accelerator,
        execute: () => this.execute(commandId, args, options.rootMenuPath),
      };

      if (isOSX) {
        const role = this.roleFor(node.id);
        if (role) {
          menuItem.role = role;
          delete menuItem.execute;
        }
      }
      parentItems.push(menuItem);

      if (this.commandRegistry.getToggledHandler(commandId, ...args)) {
        this.toggledCommands.add(commandId);
      }
    }
    return parentItems;
  }

  /**
   * `true` if either has at least `children`, or was forced to be visible.
   */
  private visibleSubmenu(node: MenuNode & CompoundMenuNode): boolean {
    return node.children.length > 0 || this.visibleLeafSubmenu(node);
  }

  /**
   * The node is a visible submenu if is a compound node but has zero children.
   */
  private visibleLeafSubmenu(node: MenuNode): boolean {
    if (CompoundMenuNode.is(node)) {
      return (
        node.children.length === 0 &&
        AlwaysVisibleSubmenus.findIndex(
          (menuPath) => menuPath[menuPath.length - 1] === node.id
        ) >= 0
      );
    }
    return false;
  }
}

const AlwaysVisibleSubmenus: MenuPath[] = [
  ArduinoMenus.TOOLS__PORTS_SUBMENU, // #655
  ArduinoMenus.FILE__SKETCHBOOK_SUBMENU, // #569
];
