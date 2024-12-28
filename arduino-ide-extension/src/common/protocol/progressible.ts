import { ApplicationError } from '@theia/core/lib/common/application-error';
import type { CancellationToken } from '@theia/core/lib/common/cancellation';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import type { MessageService } from '@theia/core/lib/common/message-service';
import type { Progress } from '@theia/core/lib/common/message-service-protocol';
import { userAbort } from '../nls';
import type { ResponseServiceClient } from './response-service';

export const UserAbortApplicationError = ApplicationError.declare(
  9999,
  (message: string, uri: string) => {
    return {
      message,
      data: { uri },
    };
  }
);

export class UserAbortError extends Error {
  constructor() {
    super(userAbort);
    Object.setPrototypeOf(this, UserAbortError.prototype);
  }
}

export namespace ExecuteWithProgress {
  export async function doWithProgress<T>(options: {
    run: ({
      progressId,
      cancellationToken,
    }: {
      progressId: string;
      cancellationToken?: CancellationToken;
    }) => Promise<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    progressText: string;
    keepOutput?: boolean;
    cancelable?: boolean;
  }): Promise<T> {
    return withProgress(
      options.progressText,
      options.messageService,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (progress, token) => {
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
          if (!options.keepOutput) {
            options.responseService.clearOutput();
          }
          const result = await options.run({
            progressId,
            cancellationToken: token,
          });
          return result;
        } finally {
          toDispose.dispose();
        }
      },
      options.cancelable
    );
  }

  export async function withProgress<T>(
    text: string,
    messageService: MessageService,
    cb: (progress: Progress, token: CancellationToken) => Promise<T>,
    cancelable = false
  ): Promise<T> {
    const cancellationSource = new CancellationTokenSource();
    const { token } = cancellationSource;
    const progress = await messageService.showProgress(
      { text, options: { cancelable } },
      () => cancellationSource.cancel()
    );
    try {
      const result = await cb(progress, token);
      return result;
    } finally {
      progress.cancel();
    }
  }
}
