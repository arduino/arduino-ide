import { Minimatch } from 'minimatch';
import type { WatchOptions } from '@theia/filesystem/lib/common/filesystem-watcher-protocol';
import {
  ParcelFileSystemWatcherService,
  ParcelWatcher,
} from '@theia/filesystem/lib/node/parcel-watcher/parcel-filesystem-service';

// Dispose the watcher immediately when the last reference is removed. By default, Theia waits 10 sec.
// https://github.com/eclipse-theia/theia/issues/11639#issuecomment-1238980708
const NoDelay = 0;

export class NoDelayDisposalTimeoutParcelFileSystemWatcherService extends ParcelFileSystemWatcherService {
  protected override createWatcher(
    clientId: number,
    fsPath: string,
    options: WatchOptions
  ): ParcelWatcher {
    const watcherOptions = {
      ignored: options.ignored.map(
        (pattern) => new Minimatch(pattern, { dot: true })
      ),
    };
    return new ParcelWatcher(
      clientId,
      fsPath,
      watcherOptions,
      this.options,
      this.maybeClient,
      NoDelay
    );
  }
}
