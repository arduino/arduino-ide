import { promises as fs } from 'fs';
import { constants } from 'fs';
import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { FileSystemExt } from '../common/protocol/filesystem-ext';
import { duration } from '../common/decorators';

@injectable()
export class NodeFileSystemExt implements FileSystemExt {
  async getUri(fsPath: string): Promise<string> {
    return FileUri.create(fsPath).toString();
  }
  @duration({ name: 'filesystem-ext#exists' })
  async exists(uri: string): Promise<boolean> {
    if (uri.startsWith('file://')) {
      try {
        await fs.access(FileUri.fsPath(uri), constants.W_OK | constants.R_OK);
        return true;
      } catch {
        return false;
      }
    }
    throw new Error(
      `Expected a 'file' scheme. Use 'FileService' instead. URI was: '${uri}'.`
    );
  }
}
