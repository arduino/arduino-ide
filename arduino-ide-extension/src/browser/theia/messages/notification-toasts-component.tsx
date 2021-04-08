import * as React from 'react';
import { NotificationComponent } from './notification-component';
import { NotificationToastsComponent as TheiaNotificationToastsComponent } from '@theia/messages/lib/browser/notification-toasts-component'

export class NotificationToastsComponent extends TheiaNotificationToastsComponent {

    render(): React.ReactNode {
        return (
            <div className={`theia-notifications-container theia-notification-toasts ${this.state.visibilityState === 'toasts' ? 'open' : 'closed'}`}>
                <div className='theia-notification-list'>
                    {this.state.toasts.map(notification => <NotificationComponent key={notification.messageId} notification={notification} manager={this.props.manager} />)}
                </div>
            </div>
        );
    }

}
