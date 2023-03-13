import {
  CommandHandler,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import {
  MenuModelRegistry,
  MenuPath,
  SubMenuOptions,
} from '@theia/core/lib/common/menu';
import { unregisterSubmenu } from './arduino-menus';

export interface MenuTemplate {
  readonly menuLabel: string;
}

export function isMenuTemplate(arg: unknown): arg is MenuTemplate {
  return (
    typeof arg === 'object' &&
    (arg as MenuTemplate).menuLabel !== undefined &&
    typeof (arg as MenuTemplate).menuLabel === 'string'
  );
}

export interface MenuActionTemplate extends MenuTemplate {
  readonly menuPath: MenuPath;
  readonly handler: CommandHandler;
  /**
   * If not defined the insertion oder will be the order string.
   */
  readonly order?: string;
}

export function isMenuActionTemplate(
  arg: MenuTemplate
): arg is MenuActionTemplate {
  return (
    isMenuTemplate(arg) &&
    (arg as MenuActionTemplate).handler !== undefined &&
    typeof (arg as MenuActionTemplate).handler === 'object' &&
    (arg as MenuActionTemplate).menuPath !== undefined &&
    Array.isArray((arg as MenuActionTemplate).menuPath)
  );
}

export function menuActionWithCommandDelegate(
  template: Omit<MenuActionTemplate, 'handler' | 'menuLabel'> & {
    command: string;
  },
  commandRegistry: CommandRegistry
): MenuActionTemplate {
  const id = template.command;
  const command = commandRegistry.getCommand(id);
  if (!command) {
    throw new Error(`Could not find the registered command with ID: ${id}`);
  }
  return {
    ...template,
    menuLabel: command.label ?? id,
    handler: {
      execute: (args) => commandRegistry.executeCommand(id, args),
      isEnabled: (args) => commandRegistry.isEnabled(id, args),
      isVisible: (args) => commandRegistry.isVisible(id, args),
      isToggled: (args) => commandRegistry.isToggled(id, args),
    },
  };
}

export interface SubmenuTemplate extends MenuTemplate {
  readonly menuLabel: string;
  readonly submenuPath: MenuPath;
  readonly options?: SubMenuOptions;
}

interface Services {
  readonly commandRegistry: CommandRegistry;
  readonly menuRegistry: MenuModelRegistry;
}

class MenuIndexCounter {
  private _counter: number;
  constructor(counter = 0) {
    this._counter = counter;
  }
  getAndIncrement(): number {
    const counter = this._counter;
    this._counter++;
    return counter;
  }
}

export function registerMenus(
  options: {
    contextId: string;
    templates: Array<MenuActionTemplate | SubmenuTemplate>;
  } & Services
): Disposable {
  const { templates } = options;
  const menuIndexCounter = new MenuIndexCounter();
  return new DisposableCollection(
    ...templates.map((template) =>
      registerMenu({ template, menuIndexCounter, ...options })
    )
  );
}

function registerMenu(
  options: {
    contextId: string;
    menuIndexCounter: MenuIndexCounter;
    template: MenuActionTemplate | SubmenuTemplate;
  } & Services
): Disposable {
  const {
    template,
    commandRegistry,
    menuRegistry,
    contextId,
    menuIndexCounter,
  } = options;
  if (isMenuActionTemplate(template)) {
    const { menuLabel, menuPath, handler, order } = template;
    const id = generateCommandId(contextId, menuLabel, menuPath);
    const index = menuIndexCounter.getAndIncrement();
    return new DisposableCollection(
      commandRegistry.registerCommand({ id }, handler),
      menuRegistry.registerMenuAction(menuPath, {
        commandId: id,
        label: menuLabel,
        order: typeof order === 'string' ? order : String(index).padStart(4),
      })
    );
  } else {
    const { menuLabel, submenuPath, options } = template;
    return new DisposableCollection(
      menuRegistry.registerSubmenu(submenuPath, menuLabel, options),
      Disposable.create(() => unregisterSubmenu(submenuPath, menuRegistry))
    );
  }

  function generateCommandId(
    contextId: string,
    menuLabel: string,
    menuPath: MenuPath
  ): string {
    return `arduino-${contextId}-context-${menuPath.join('-')}-${menuLabel}`;
  }
}
