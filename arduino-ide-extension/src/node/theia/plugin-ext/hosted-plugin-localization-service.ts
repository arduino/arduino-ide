import * as fs from '@theia/core/shared/fs-extra';
import { injectable } from '@theia/core/shared/inversify';
import { HostedPluginLocalizationService as TheiaHostedPluginLocalizationService } from '@theia/plugin-ext/lib/hosted/node/hosted-plugin-localization-service';

@injectable()
export class HostedPluginLocalizationService extends TheiaHostedPluginLocalizationService {
  // Remove when https://github.com/eclipse-theia/theia/pull/11853 is available from Theia.
  override async initialize(): Promise<void> {
    this.getLocalizationCacheDir()
      .then((cacheDir) => fs.emptyDir(cacheDir))
      .then(() => this._ready.resolve());
  }
}
