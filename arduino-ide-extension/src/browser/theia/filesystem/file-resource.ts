import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import {
  FileResource,
  FileResourceOptions,
  FileResourceResolver as TheiaFileResourceResolver,
} from '@theia/filesystem/lib/browser/file-resource';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
  FileOperationError,
  FileOperationResult,
} from '@theia/filesystem/lib/common/files';
import * as PQueue from 'p-queue';

@injectable()
export class FileResourceResolver extends TheiaFileResourceResolver {
  override async resolve(uri: URI): Promise<WriteQueuedFileResource> {
    let stat;
    try {
      stat = await this.fileService.resolve(uri);
    } catch (e) {
      if (
        !(
          e instanceof FileOperationError &&
          e.fileOperationResult === FileOperationResult.FILE_NOT_FOUND
        )
      ) {
        throw e;
      }
    }
    if (stat && stat.isDirectory) {
      throw new Error(
        'The given uri is a directory: ' + this.labelProvider.getLongName(uri)
      );
    }
    return new WriteQueuedFileResource(uri, this.fileService, {
      isReadonly: stat?.isReadonly ?? false,
      shouldOverwrite: () => this.shouldOverwrite(uri),
      shouldOpenAsText: (error) => this.shouldOpenAsText(uri, error),
    });
  }
}

class WriteQueuedFileResource extends FileResource {
  private readonly writeQueue = new PQueue({ autoStart: true, concurrency: 1 });

  constructor(
    uri: URI,
    fileService: FileService,
    options: FileResourceOptions
  ) {
    super(uri, fileService, options);
    const originalDoWrite = this['doWrite'];
    this['doWrite'] = (content, options) =>
      this.writeQueue.add(() => originalDoWrite.bind(this)(content, options));
    const originalSaveStream = this['saveStream'];
    if (originalSaveStream) {
      this['saveStream'] = (content, options) =>
        this.writeQueue.add(() =>
          originalSaveStream.bind(this)(content, options)
        );
    }
    const originalSaveContents = this['saveContents'];
    if (originalSaveContents) {
      this['saveContents'] = (content, options) =>
        this.writeQueue.add(() =>
          originalSaveContents.bind(this)(content, options)
        );
    }
    const originalSaveContentChanges = this['saveContentChanges'];
    if (originalSaveContentChanges) {
      this['saveContentChanges'] = (changes, options) =>
        this.writeQueue.add(() =>
          originalSaveContentChanges.bind(this)(changes, options)
        );
    }
  }

  protected override async isInSync(): Promise<boolean> {
    // Let all the write operations finish to update the version (mtime) before checking whether the resource is in sync.
    // https://github.com/eclipse-theia/theia/issues/12327
    await this.writeQueue.onIdle();
    return super.isInSync();
  }
}
