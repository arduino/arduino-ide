import {
  KeybindingContext,
  KeybindingRegistry as TheiaKeybindingRegistry,
} from '@theia/core/lib/browser/keybinding';
import { injectable } from '@theia/core/shared/inversify';
import { measure } from '../../../common/utils';

@injectable()
export class KeybindingRegistry extends TheiaKeybindingRegistry {
  override onStart(): Promise<void> {
    return measure('KeybindingRegistry#onStart', () => super.onStart());
  }
  protected override registerContext(...contexts: KeybindingContext[]): void {
    return measure(
      'KeybindingRegistry#registerContext',
      () => super.registerContext(...contexts),
      ...contexts.map(({ id }) => id)
    );
  }
}
