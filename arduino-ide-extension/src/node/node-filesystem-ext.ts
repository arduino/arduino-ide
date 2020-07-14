import { injectable } from 'inversify';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { FileSystemExt } from '../common/protocol/filesystem-ext';

@injectable()
export class NodeFileSystemExt implements FileSystemExt {

    async getUri(fsPath: string): Promise<string> {
        return FileUri.create(fsPath).toString()
    }

}
