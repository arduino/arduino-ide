import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { injectable } from 'inversify';
import { NotificationCenterComponent } from './notification-center-component';
import { NotificationToastsComponent } from './notification-toasts-component';
import { NotificationsRenderer as TheiaNotificationsRenderer } from '@theia/messages/lib/browser/notifications-renderer';

@injectable()
export class NotificationsRenderer extends TheiaNotificationsRenderer {

    protected render(): void {
        ReactDOM.render(<div>
            <NotificationToastsComponent manager={this.manager} corePreferences={this.corePreferences} />
            <NotificationCenterComponent manager={this.manager} />
        </div>, this.container);
    }

}
