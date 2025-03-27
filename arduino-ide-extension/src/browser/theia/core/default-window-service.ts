import { DefaultWindowService as TheiaDefaultWindowService } from '@theia/core/lib/browser/window/default-window-service';
import { injectable } from '@theia/core/shared/inversify';
import { WindowServiceExt } from './window-service-ext';

@injectable()
export class DefaultWindowService
  extends TheiaDefaultWindowService
  implements WindowServiceExt
{
  /**
   * The default implementation always resolves to `true`.
   * IDE2 does not use it. It's currently an electron-only app.
   */
  async isFirstWindow(): Promise<boolean> {
    return true;
  }
}