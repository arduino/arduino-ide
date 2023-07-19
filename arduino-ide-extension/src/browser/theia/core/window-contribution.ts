import { injectable } from '@theia/core/shared/inversify';
import { WindowContribution as TheiaWindowContribution } from '@theia/core/lib/browser/window-contribution';

@injectable()
export class WindowContribution extends TheiaWindowContribution {
  override registerCommands(): void {
    // NOOP
  }
  override registerKeybindings(): void {
    // NOO
  }
  override registerMenus(): void {
    // NOOP;
  }
}
