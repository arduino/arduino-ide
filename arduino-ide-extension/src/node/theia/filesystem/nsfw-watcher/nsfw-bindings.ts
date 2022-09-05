import { join } from 'path';
import { interfaces } from '@theia/core/shared/inversify';
import {
  NsfwFileSystemWatcherServiceProcessOptions,
  NSFW_SINGLE_THREADED,
  spawnNsfwFileSystemWatcherServiceProcess,
} from '@theia/filesystem/lib/node/filesystem-backend-module';
import { FileSystemWatcherService } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import { NsfwFileSystemWatcherServerOptions } from '@theia/filesystem/lib/node/nsfw-watcher/nsfw-filesystem-service';
import { FileSystemWatcherServiceDispatcher } from '@theia/filesystem/lib/node/filesystem-watcher-dispatcher';
import { NoDelayDisposalTimeoutNsfwFileSystemWatcherService } from './nsfw-filesystem-service';

export function rebindNsfwFileSystemWatcher(rebind: interfaces.Rebind): void {
  rebind<NsfwFileSystemWatcherServiceProcessOptions>(
    NsfwFileSystemWatcherServiceProcessOptions
  ).toConstantValue({
    entryPoint: join(__dirname, 'index.js'),
  });
  rebind<FileSystemWatcherService>(FileSystemWatcherService)
    .toDynamicValue((context) =>
      NSFW_SINGLE_THREADED
        ? createNsfwFileSystemWatcherService(context)
        : spawnNsfwFileSystemWatcherServiceProcess(context)
    )
    .inSingletonScope();
}

function createNsfwFileSystemWatcherService({
  container,
}: interfaces.Context): FileSystemWatcherService {
  const options = container.get<NsfwFileSystemWatcherServerOptions>(
    NsfwFileSystemWatcherServerOptions
  );
  const dispatcher = container.get<FileSystemWatcherServiceDispatcher>(
    FileSystemWatcherServiceDispatcher
  );
  const server = new NoDelayDisposalTimeoutNsfwFileSystemWatcherService(
    options
  );
  server.setClient(dispatcher);
  return server;
}
