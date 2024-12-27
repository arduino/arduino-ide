import { inject, injectable } from '@theia/core/shared/inversify';
import { URI as Uri } from '@theia/core/shared/vscode-uri';
import URI from '@theia/core/lib/common/uri';
import { Deferred } from '@theia/core/lib/common/promise-util';
import {
  FileSystemProvider,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
} from '@theia/filesystem/lib/common/files';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { DelegatingFileSystemProvider } from '@theia/filesystem/lib/common/delegating-file-system-provider';
import {
  FileService,
  FileServiceContribution,
} from '@theia/filesystem/lib/browser/file-service';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { AuthenticationSession } from '../../common/protocol/authentication-service';
import { ConfigService } from '../../common/protocol';
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from '../utils/constants';

export namespace LocalCacheUri {
  export const scheme = 'arduino-local-cache';
  export const root = new URI(
    Uri.parse('/').with({ scheme, authority: 'create' })
  );
}

@injectable()
export class LocalCacheFsProvider
  implements FileServiceContribution, DelegatingFileSystemProvider.URIConverter
{
  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(AuthenticationClientService)
  protected readonly authenticationService: AuthenticationClientService;

  readonly ready = new Deferred<void>();

  private _localCacheRoot: URI;

  registerFileSystemProviders(fileService: FileService): void {
    fileService.onWillActivateFileSystemProvider(async (event) => {
      if (event.scheme === LocalCacheUri.scheme) {
        event.waitUntil(
          (async () => {
            this.init(fileService);
            const provider = await this.createProvider(fileService);
            fileService.registerProvider(LocalCacheUri.scheme, provider);
          })()
        );
      }
    });
  }

  to(resource: URI): URI | undefined {
    const relativePath = LocalCacheUri.root.relative(resource);
    if (relativePath) {
      return this.currentUserUri.resolve(relativePath).normalizePath();
    }
    return undefined;
  }

  from(resource: URI): URI | undefined {
    const relativePath = this.currentUserUri.relative(resource);
    if (relativePath) {
      return LocalCacheUri.root.resolve(relativePath);
    }
    return undefined;
  }

  protected async createProvider(
    fileService: FileService
  ): Promise<FileSystemProvider> {
    const delegate = await fileService.activateProvider('file');
    await this.ready.promise;
    return new DelegatingFileSystemProvider(
      delegate,
      {
        uriConverter: this,
      },
      new DisposableCollection(
        delegate.watch(this.localCacheRoot, {
          excludes: [],
          recursive: true,
        })
      )
    );
  }

  protected async init(fileService: FileService): Promise<void> {
    const { config } = await this.configService.getConfiguration();
    // Any possible CLI config errors are ignored here. IDE2 does not verify the `directories.data` folder.
    // If the data dir is accessible, IDE2 creates the cache folder for the cloud sketches. Otherwise, it does not.
    // The data folder can be configured outside of the IDE2, and the new data folder will be picked up with a
    // subsequent IDE2 start.
    if (!config?.dataDirUri) {
      return; // the deferred promise will never resolve
    }
    const localCacheUri = new URI(config.dataDirUri);
    try {
      await fileService.access(localCacheUri);
    } catch (err) {
      console.error(
        `'directories.data' location is inaccessible at ${config.dataDirUri}`,
        err
      );
      return;
    }
    this._localCacheRoot = localCacheUri;
    for (const segment of [REMOTE_SKETCHBOOK_FOLDER, ARDUINO_CLOUD_FOLDER]) {
      this._localCacheRoot = this._localCacheRoot.resolve(segment);
      await fileService.createFolder(this._localCacheRoot);
    }
    this.session(fileService).then(() => this.ready.resolve());
    this.authenticationService.onSessionDidChange(async (session) => {
      if (session) {
        await this.ensureExists(session, fileService);
      }
    });
  }

  public get currentUserUri(): URI {
    const { session } = this.authenticationService;
    if (!session) {
      throw new FileSystemProviderError(
        'Not logged in.',
        FileSystemProviderErrorCode.NoPermissions
      );
    }
    return this.toUri(session);
  }

  private get localCacheRoot(): URI {
    return this._localCacheRoot;
  }

  private async session(
    fileService: FileService
  ): Promise<AuthenticationSession> {
    return new Promise<AuthenticationSession>(async (resolve) => {
      const { session } = this.authenticationService;
      if (session) {
        await this.ensureExists(session, fileService);
        resolve(session);
        return;
      }
      const toDispose = new DisposableCollection();
      toDispose.push(
        this.authenticationService.onSessionDidChange(async (session) => {
          if (session) {
            await this.ensureExists(session, fileService);
            toDispose.dispose();
            resolve(session);
          }
        })
      );
    });
  }

  private async ensureExists(
    session: AuthenticationSession,
    fileService: FileService
  ): Promise<URI> {
    const uri = this.toUri(session);
    const exists = await fileService.exists(uri);
    if (!exists) {
      await fileService.createFolder(uri);
    }
    return uri;
  }

  toUri(session: AuthenticationSession): URI {
    // Hack: instead of getting the UUID only, we get `auth0|UUID` after the authentication. `|` cannot be part of filesystem path or filename.
    return this._localCacheRoot.resolve(session.id.split('|')[1]);
  }
}
