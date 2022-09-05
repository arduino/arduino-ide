import * as yargs from '@theia/core/shared/yargs';
import { JsonRpcProxyFactory } from '@theia/core';
import { NoDelayDisposalTimeoutNsfwFileSystemWatcherService } from './nsfw-filesystem-service';
import type { IPCEntryPoint } from '@theia/core/lib/node/messaging/ipc-protocol';
import type { FileSystemWatcherServiceClient } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';

const options: {
  verbose: boolean;
} = yargs
  .option('verbose', {
    default: false,
    alias: 'v',
    type: 'boolean',
  })
  .option('nsfwOptions', {
    alias: 'o',
    type: 'string',
    coerce: JSON.parse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }).argv as any;

export default <IPCEntryPoint>((connection) => {
  const server = new NoDelayDisposalTimeoutNsfwFileSystemWatcherService(
    options
  );
  const factory = new JsonRpcProxyFactory<FileSystemWatcherServiceClient>(
    server
  );
  server.setClient(factory.createProxy());
  factory.listen(connection);
});
