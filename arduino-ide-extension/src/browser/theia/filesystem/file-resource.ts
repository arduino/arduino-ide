import { ResourceSaveOptions } from '@theia/core/lib/common/resource';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import {
  FileResource,
  FileResourceOptions,
  FileResourceResolver as TheiaFileResourceResolver,
} from '@theia/filesystem/lib/browser/file-resource';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
  ETAG_DISABLED,
  FileOperationError,
  FileOperationResult,
} from '@theia/filesystem/lib/common/files';
import PQueue from 'p-queue';

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
      readOnly: stat?.isReadonly ?? false,
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
    this['doWrite'] = (content, options) => {
      if (isETagDisabledResourceSaveOptions(options)) {
        // When force overriding without auto-save do not enqueue the modification, it's already enqueued and the conflict is just being resolved.
        // https://github.com/arduino/arduino-ide/issues/2051
        return originalDoWrite.bind(this)(content, options);
      }
      return this.writeQueue.add(() =>
        originalDoWrite.bind(this)(content, options)
      );
    };
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

// Theia incorrectly sets the disabled ETag on the `stat` instead of the `version` so `FileResourceVersion#is` is unusable.
// https://github.com/eclipse-theia/theia/blob/f9063625b861b8433341fcd1a29a0d0298778f4c/packages/filesystem/src/browser/file-resource.ts#L210
// https://github.com/eclipse-theia/theia/blob/f9063625b861b8433341fcd1a29a0d0298778f4c/packages/filesystem/src/browser/file-resource.ts#L34
// https://github.com/eclipse-theia/theia/discussions/12502
function isETagDisabledResourceSaveOptions(
  options?: ResourceSaveOptions
): boolean {
  if (typeof options === 'object') {
    if ('version' in options && typeof options['version'] === 'object') {
      const version = <Record<string, unknown>>options['version'];
      if (version && 'stat' in version && typeof version['stat'] === 'object') {
        const stat = <Record<string, unknown>>version['stat'];
        if (stat) {
          return 'etag' in stat && stat['etag'] === ETAG_DISABLED;
        }
      }
    }
  }
  return false;
}
