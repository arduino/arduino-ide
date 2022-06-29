import * as semver from 'semver';
import type { Progress } from '@theia/core/lib/common/message-service-protocol';
import {
  CancellationToken,
  CancellationTokenSource,
} from '@theia/core/lib/common/cancellation';
import { naturalCompare } from './../utils';
import type { ArduinoComponent } from './arduino-component';
import type { MessageService } from '@theia/core/lib/common/message-service';
import type { ResponseServiceClient } from './response-service';

export interface Installable<T extends ArduinoComponent> {
  /**
   * If `options.version` is specified, that will be installed. Otherwise, `item.availableVersions[0]`.
   */
  install(options: {
    item: T;
    progressId?: string;
    version?: Installable.Version;
  }): Promise<void>;

  /**
   * Uninstalls the given component. It is a NOOP if not installed.
   */
  uninstall(options: { item: T; progressId?: string }): Promise<void>;
}
export namespace Installable {
  export type Version = string;

  export namespace Version {
    /**
     * Most recent version comes first, then the previous versions. (`1.8.1`, `1.6.3`, `1.6.2`, `1.6.1` and so on.)
     */
    export const COMPARATOR = (left: Version, right: Version) => {
      if (semver.valid(left) && semver.valid(right)) {
        return semver.compare(left, right);
      }
      return naturalCompare(left, right);
    };
  }

  export async function installWithProgress<
    T extends ArduinoComponent
  >(options: {
    installable: Installable<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    item: T;
    version: Installable.Version;
  }): Promise<void> {
    const { item, version } = options;
    return doWithProgress({
      ...options,
      progressText: `Processing ${item.name}:${version}`,
      run: ({ progressId }) =>
        options.installable.install({
          item: options.item,
          version: options.version,
          progressId,
        }),
    });
  }

  export async function uninstallWithProgress<
    T extends ArduinoComponent
  >(options: {
    installable: Installable<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    item: T;
  }): Promise<void> {
    const { item } = options;
    return doWithProgress({
      ...options,
      progressText: `Processing ${item.name}${
        item.installedVersion ? `:${item.installedVersion}` : ''
      }`,
      run: ({ progressId }) =>
        options.installable.uninstall({
          item: options.item,
          progressId,
        }),
    });
  }

  export async function doWithProgress(options: {
    run: ({ progressId }: { progressId: string }) => Promise<void>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    progressText: string;
  }): Promise<void> {
    return withProgress(
      options.progressText,
      options.messageService,
      async (progress, _) => {
        const progressId = progress.id;
        const toDispose = options.responseService.onProgressDidChange(
          (progressMessage) => {
            if (progressId === progressMessage.progressId) {
              const { message, work } = progressMessage;
              progress.report({ message, work });
            }
          }
        );
        try {
          options.responseService.clearOutput();
          await options.run({ progressId });
        } finally {
          toDispose.dispose();
        }
      }
    );
  }

  async function withProgress(
    text: string,
    messageService: MessageService,
    cb: (progress: Progress, token: CancellationToken) => Promise<void>
  ): Promise<void> {
    const cancellationSource = new CancellationTokenSource();
    const { token } = cancellationSource;
    const progress = await messageService.showProgress(
      { text, options: { cancelable: false } },
      () => cancellationSource.cancel()
    );
    try {
      await cb(progress, token);
    } finally {
      progress.cancel();
    }
  }
}
