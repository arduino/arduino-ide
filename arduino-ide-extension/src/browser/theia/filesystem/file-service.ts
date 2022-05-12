import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FileService as TheiaFileService } from '@theia/filesystem/lib/browser/file-service';
import { FileAccess } from '@theia/filesystem/lib/common/filesystem';
import { duration } from '../../../common/decorators';

@injectable()
export class FileService extends TheiaFileService {
  @duration()
  async exists(resource: URI): Promise<boolean> {
    const provider = await this.withProvider(resource);
    if (provider.access) {
      try {
        await provider.access(
          resource,
          FileAccess.Constants.R_OK | FileAccess.Constants.W_OK
        );
        return true;
      } catch {
        return false;
      }
    }
    return super.exists(resource);
  }
}
