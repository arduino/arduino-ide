import { Progress } from '@theia/core/lib/common/message-service-protocol';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ProgressMessage } from '../../common/protocol';
import { NotificationCenter } from '../notification-center';
import { Contribution } from './contribution';

@injectable()
export class IndexesUpdateProgress extends Contribution {
  @inject(NotificationCenter)
  private readonly notificationCenter: NotificationCenter;
  @inject(ProgressService)
  private readonly progressService: ProgressService;
  private currentProgress:
    | (Progress & Readonly<{ progressId: string }>)
    | undefined;

  override onStart(): void {
    this.notificationCenter.onIndexUpdateWillStart(({ progressId }) =>
      this.getOrCreateProgress(progressId)
    );
    this.notificationCenter.onIndexUpdateDidProgress((progress) => {
      this.getOrCreateProgress(progress).then((delegate) =>
        delegate.report(progress)
      );
    });
    this.notificationCenter.onIndexUpdateDidComplete(({ progressId }) => {
      this.cancelProgress(progressId);
    });
    this.notificationCenter.onIndexUpdateDidFail(({ progressId, message }) => {
      this.cancelProgress(progressId);
      this.messageService.error(message);
    });
  }

  private async getOrCreateProgress(
    progressOrId: ProgressMessage | string
  ): Promise<Progress & { progressId: string }> {
    const progressId = ProgressMessage.is(progressOrId)
      ? progressOrId.progressId
      : progressOrId;
    if (this.currentProgress?.progressId === progressId) {
      return this.currentProgress;
    }
    if (this.currentProgress) {
      this.currentProgress.cancel();
    }
    this.currentProgress = undefined;
    const progress = await this.progressService.showProgress({
      text: '',
      options: { location: 'notification' },
    });
    if (ProgressMessage.is(progressOrId)) {
      progress.report(progressOrId);
    }
    this.currentProgress = { ...progress, progressId };
    return this.currentProgress;
  }

  private cancelProgress(progressId: string) {
    if (this.currentProgress) {
      if (this.currentProgress.progressId !== progressId) {
        console.warn(
          `Mismatching progress IDs. Expected ${progressId}, got ${this.currentProgress.progressId}. Canceling anyway.`
        );
      }
      this.currentProgress.cancel();
      this.currentProgress = undefined;
    }
  }
}
