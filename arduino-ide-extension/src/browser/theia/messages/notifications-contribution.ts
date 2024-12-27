/* eslint-disable prettier/prettier */
import { nls } from '@theia/core/lib/common/nls';
import { NotificationsContribution } from '@theia/messages/lib/browser/notifications-contribution';

export class MyNotificationsContribution extends NotificationsContribution {
    protected override getStatusBarItemTooltip(count: number): string {
        if (this.manager.centerVisible) {
            return nls.localizeByDefault('Hide Notifications');
        }
        return count === 0
            ? '没有新通知'
            : count === 1
                ? '1新增通知'
                : `${count.toString()}新增通知`;
    }
}
