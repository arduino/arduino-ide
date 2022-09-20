import { ElectronKeyboardLayoutProvider as TheiaElectronKeyboardLayoutProvider } from '@theia/core/lib/electron-node/keyboard/electron-keyboard-layout-provider';
import { NativeKeyboardLayout } from '@theia/core/lib/common/keyboard/keyboard-layout-provider';
import { injectable } from '@theia/core/shared/inversify';
import * as nativeKeymap from '@theia/electron/shared/native-keymap';
import { measure } from '../../common/utils';

@injectable()
export class ElectronKeyboardLayoutProvider extends TheiaElectronKeyboardLayoutProvider {
  override getNativeLayout(): Promise<NativeKeyboardLayout> {
    return measure('ElectronKeyboardLayoutProvider#getNativeLayout', () =>
      super.getNativeLayout()
    );
  }
  protected override getNativeLayoutSync(): NativeKeyboardLayout {
    return {
      info: measure(
        'ElectronKeyboardLayoutProvider#getNativeLayoutSync#getCurrentKeyboardLayout',
        () => nativeKeymap.getCurrentKeyboardLayout()
      ),
      mapping: measure(
        'ElectronKeyboardLayoutProvider#getNativeLayoutSync#getKeyMap',
        () => nativeKeymap.getKeyMap()
      ),
    };
  }
}
