import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { injectable } from '@theia/core/shared/inversify';
import {
  TypeHierarchyCommands,
  TypeHierarchyContribution as TheiaTypeHierarchyContribution,
} from '@theia/typehierarchy/lib/browser/typehierarchy-contribution';

@injectable()
export class TypeHierarchyContribution extends TheiaTypeHierarchyContribution {
  protected override init(): void {
    // NOOP
  }

  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.unregisterCommand(TypeHierarchyCommands.OPEN_SUBTYPE.id);
    registry.unregisterCommand(TypeHierarchyCommands.OPEN_SUPERTYPE.id);
  }

  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);
    registry.unregisterMenuAction(TypeHierarchyCommands.OPEN_SUBTYPE.id);
    registry.unregisterMenuAction(TypeHierarchyCommands.OPEN_SUPERTYPE.id);
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    super.registerKeybindings(registry);
    registry.unregisterKeybinding(TypeHierarchyCommands.OPEN_SUBTYPE.id);
  }
}
