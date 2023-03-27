import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FilePermission, Stat } from '@theia/filesystem/lib/common/files';
import { DiskFileSystemProvider as TheiaDiskFileSystemProvider } from '@theia/filesystem/lib/node/disk-file-system-provider';
import { Mode } from 'stat-mode';

@injectable()
export class DiskFileSystemProvider extends TheiaDiskFileSystemProvider {
  override async stat(resource: URI): Promise<Stat> {
    try {
      const { stat, symbolicLink } = await this.statLink(
        this.toFilePath(resource)
      ); // cannot use fs.stat() here to support links properly
      const mode = new Mode(stat);
      return {
        type: this['toType'](stat, symbolicLink),
        ctime: stat.birthtime.getTime(), // intentionally not using ctime here, we want the creation time
        mtime: stat.mtime.getTime(),
        size: stat.size,
        permissions: !mode.owner.write ? FilePermission.Readonly : undefined, // Customized for https://github.com/eclipse-theia/theia/pull/12354
      };
    } catch (error) {
      throw this['toFileSystemProviderError'](error);
    }
  }
}
