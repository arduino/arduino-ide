import { join } from 'node:path';
import { interfaces } from '@theia/core/shared/inversify';
import {
  FileSystemWatcherServiceProcessOptions,
  WATCHER_SINGLE_THREADED,
  spawnParcelFileSystemWatcherServiceProcess,
} from '@theia/filesystem/lib/node/filesystem-backend-module';
import { FileSystemWatcherService } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { ParcelFileSystemWatcherServerOptions } from '@theia/filesystem/lib/node/parcel-watcher/parcel-filesystem-service';
import { FileSystemWatcherServiceDispatcher } from '@theia/filesystem/lib/node/filesystem-watcher-dispatcher';
import { NoDelayDisposalTimeoutParcelFileSystemWatcherService } from './parcel-watcher/parcel-filesystem-service';

export function rebindParcelFileSystemWatcher(rebind: interfaces.Rebind): void {
  rebind<FileSystemWatcherServiceProcessOptions>(
    FileSystemWatcherServiceProcessOptions
  ).toConstantValue({
    entryPoint: join(__dirname, 'parcel-watcher'),
  });
  rebind<FileSystemWatcherService>(FileSystemWatcherService)
    .toDynamicValue((context) =>
      WATCHER_SINGLE_THREADED
        ? createParcelFileSystemWatcherService(context)
        : spawnParcelFileSystemWatcherServiceProcess(context)
    )
    .inSingletonScope();
}

function createParcelFileSystemWatcherService({
  container,
}: interfaces.Context): FileSystemWatcherService {
  const options = container.get<ParcelFileSystemWatcherServerOptions>(
    ParcelFileSystemWatcherServerOptions
  );
  const dispatcher = container.get<FileSystemWatcherServiceDispatcher>(
    FileSystemWatcherServiceDispatcher
  );
  const server = new NoDelayDisposalTimeoutParcelFileSystemWatcherService(
    options
  );
  server.setClient(dispatcher);
  return server;
}
