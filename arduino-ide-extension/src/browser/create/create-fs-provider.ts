import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { Event } from '@theia/core/lib/common/event';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import {
  Stat,
  FileType,
  FileChange,
  FileWriteOptions,
  FileDeleteOptions,
  FileOverwriteOptions,
  FileSystemProvider,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  FileSystemProviderCapabilities,
  WatchOptions,
} from '@theia/filesystem/lib/common/files';
import {
  FileService,
  FileServiceContribution,
} from '@theia/filesystem/lib/browser/file-service';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { CreateApi } from './create-api';
import { CreateUri } from './create-uri';
import { SketchesService } from '../../common/protocol';
import { ArduinoPreferences } from '../arduino-preferences';
import { Create } from './typings';

@injectable()
export class CreateFsProvider
  implements
    FileSystemProvider,
    FrontendApplicationContribution,
    FileServiceContribution
{
  @inject(AuthenticationClientService)
  protected readonly authenticationService: AuthenticationClientService;

  @inject(CreateApi)
  protected readonly createApi: CreateApi;

  @inject(SketchesService)
  protected readonly sketchesService: SketchesService;

  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  protected readonly toDispose = new DisposableCollection();

  readonly onFileWatchError: Event<void> = Event.None;
  readonly onDidChangeFile: Event<readonly FileChange[]> = Event.None;
  readonly onDidChangeCapabilities: Event<void> = Event.None;
  readonly capabilities: FileSystemProviderCapabilities =
    FileSystemProviderCapabilities.FileReadWrite |
    FileSystemProviderCapabilities.PathCaseSensitive |
    FileSystemProviderCapabilities.Access;

  onStop(): void {
    this.toDispose.dispose();
  }

  registerFileSystemProviders(service: FileService): void {
    service.onWillActivateFileSystemProvider((event) => {
      if (event.scheme === CreateUri.scheme) {
        event.waitUntil(
          (async () => {
            service.registerProvider(CreateUri.scheme, this);
          })()
        );
      }
    });
  }

  watch(uri: URI, opts: WatchOptions): Disposable {
    return Disposable.NULL;
  }

  async stat(uri: URI): Promise<Stat> {
    if (CreateUri.equals(CreateUri.root, uri)) {
      this.getCreateApi; // This will throw when not logged in.
      return {
        type: FileType.Directory,
        ctime: 0,
        mtime: 0,
        size: 0,
      };
    }
    const resource = await this.getCreateApi.stat(uri.path.toString());
    const mtime = Date.parse(resource.modified_at);
    return {
      type: this.toFileType(resource.type),
      ctime: mtime,
      mtime,
      size: 0,
    };
  }

  async mkdir(uri: URI): Promise<void> {
    await this.getCreateApi.createDirectory(uri.path.toString());
  }

  async readdir(uri: URI): Promise<[string, FileType][]> {
    const resources = await this.getCreateApi.readDirectory(
      uri.path.toString()
    );
    return resources.map(({ name, type }) => [name, this.toFileType(type)]);
  }

  async delete(uri: URI, opts: FileDeleteOptions): Promise<void> {
    if (!opts.recursive) {
      throw new Error(
        'Arduino Create file-system provider does not support non-recursive deletion.'
      );
    }
    const stat = await this.stat(uri);
    if (!stat) {
      throw new FileSystemProviderError(
        'File not found.',
        FileSystemProviderErrorCode.FileNotFound
      );
    }
    switch (stat.type) {
      case FileType.Directory: {
        await this.getCreateApi.deleteDirectory(uri.path.toString());
        break;
      }
      case FileType.File: {
        await this.getCreateApi.deleteFile(uri.path.toString());
        break;
      }
      default: {
        throw new FileSystemProviderError(
          `Unexpected file type '${stat.type}' for resource: ${uri.toString()}`,
          FileSystemProviderErrorCode.Unknown
        );
      }
    }
  }

  async rename(
    oldUri: URI,
    newUri: URI,
    options: FileOverwriteOptions
  ): Promise<void> {
    await this.getCreateApi.rename(
      oldUri.path.toString(),
      newUri.path.toString()
    );
  }

  async readFile(uri: URI): Promise<Uint8Array> {
    const content = await this.getCreateApi.readFile(uri.path.toString());
    return new TextEncoder().encode(content);
  }

  async writeFile(
    uri: URI,
    content: Uint8Array,
    options: FileWriteOptions
  ): Promise<void> {
    await this.getCreateApi.writeFile(uri.path.toString(), content);
  }

  async access(uri: URI, mode?: number): Promise<void> {
    this.getCreateApi; // Will throw if not logged in.
  }

  public toFileType(type: Create.ResourceType): FileType {
    switch (type) {
      case 'file':
        return FileType.File;
      case 'sketch':
      case 'folder':
        return FileType.Directory;
      default:
        return FileType.Unknown;
    }
  }

  private get getCreateApi(): CreateApi {
    const { session } = this.authenticationService;
    if (!session) {
      throw new FileSystemProviderError(
        'Not logged in.',
        FileSystemProviderErrorCode.NoPermissions
      );
    }
    return this.createApi;
  }
}
