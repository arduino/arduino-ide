import type { CancellationToken } from '@theia/core/lib/common/cancellation';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import type { MessageService } from '@theia/core/lib/common/message-service';
import type { Progress } from '@theia/core/lib/common/message-service-protocol';
import type { ResponseServiceClient } from './response-service';

export namespace ExecuteWithProgress {
  export async function doWithProgress<T>(options: {
    run: ({ progressId }: { progressId: string }) => Promise<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    progressText: string;
    keepOutput?: boolean;
  }): Promise<T> {
    return withProgress(
      options.progressText,
      options.messageService,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (progress, _token) => {
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
          const result = await options.run({ progressId });
          return result;
        } finally {
          toDispose.dispose();
        }
      }
    );
  }

  async function withProgress<T>(
    text: string,
    messageService: MessageService,
    cb: (progress: Progress, token: CancellationToken) => Promise<T>
  ): Promise<T> {
    const cancellationSource = new CancellationTokenSource();
    const { token } = cancellationSource;
    const progress = await messageService.showProgress(
      { text, options: { cancelable: false } },
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
