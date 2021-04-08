import { injectable } from 'inversify';
import { CancellationToken } from '@theia/core/lib/common/cancellation';
import { ProgressMessage, ProgressUpdate } from '@theia/core/lib/common/message-service-protocol';
import { NotificationManager as TheiaNotificationManager } from '@theia/messages/lib/browser/notifications-manager';

@injectable()
export class NotificationManager extends TheiaNotificationManager {

    async reportProgress(messageId: string, update: ProgressUpdate, originalMessage: ProgressMessage, cancellationToken: CancellationToken): Promise<void> {
        const notification = this.find(messageId);
        if (!notification) {
            return;
        }
        if (cancellationToken.isCancellationRequested) {
            this.clear(messageId);
        } else {
            notification.message = originalMessage.text && update.message ? `${originalMessage.text}: ${update.message}` :
                originalMessage.text || update?.message || notification.message;

            // Unlike in Theia, we allow resetting the progress monitor to NaN to enforce unknown progress.
            const candidate = this.toPlainProgress(update);
            notification.progress = typeof candidate === 'number' ? candidate : notification.progress;
        }
        this.fireUpdatedEvent();
    }

    protected toPlainProgress(update: ProgressUpdate): number | undefined {
        if (!update.work) {
            return undefined;
        }
        if (Number.isNaN(update.work.done) || Number.isNaN(update.work.total)) {
            return Number.NaN; // This should trigger the unknown monitor.
        }
        return Math.min(update.work.done / update.work.total * 100, 100);
    }

}
