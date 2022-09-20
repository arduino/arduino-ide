import {
  KeyboardLayout,
  KeyboardLayoutService as TheiaKeyboardLayoutService,
} from '@theia/core/lib/browser/keyboard/keyboard-layout-service';
import { NativeKeyboardLayout } from '@theia/core/lib/common/keyboard/keyboard-layout-provider';
import { injectable } from '@theia/core/shared/inversify';
import { measure } from '../../../common/utils';

@injectable()
export class KeyboardLayoutService extends TheiaKeyboardLayoutService {
  override initialize(): Promise<void> {
    return measure('KeyboardLayoutService#initialize', () =>
      super.initialize()
    );
  }
  protected override updateLayout(
    newLayout: NativeKeyboardLayout
  ): KeyboardLayout {
    return measure(
      'KeyboardLayoutService#updateLayout',
      () => super.updateLayout(newLayout),
      newLayout
    );
  }
  protected override transformNativeLayout(
    nativeLayout: NativeKeyboardLayout
  ): KeyboardLayout {
    return measure(
      'KeyboardLayoutService#transformNativeLayout',
      () => super.transformNativeLayout(nativeLayout),
      nativeLayout
    );
  }
}
