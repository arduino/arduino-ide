import * as React from 'react';
import { NotificationComponent } from './notification-component';
import { NotificationCenterComponent as TheiaNotificationCenterComponent } from '@theia/messages/lib/browser/notification-center-component'

const PerfectScrollbar = require('react-perfect-scrollbar');

export class NotificationCenterComponent extends TheiaNotificationCenterComponent {

    render(): React.ReactNode {
        const empty = this.state.notifications.length === 0;
        const title = empty ? 'NO NEW NOTIFICATIONS' : 'NOTIFICATIONS';
        return (
            <div className={`theia-notifications-container theia-notification-center ${this.state.visibilityState === 'center' ? 'open' : 'closed'}`}>
                <div className='theia-notification-center-header'>
                    <div className='theia-notification-center-header-title'>{title}</div>
                    <div className='theia-notification-center-header-actions'>
                        <ul className='theia-notification-actions'>
                            <li className='collapse' title='Hide Notification Center' onClick={this.onHide} />
                            <li className='clear-all' title='Clear All' onClick={this.onClearAll} />
                        </ul>
                    </div>
                </div>
                <PerfectScrollbar className='theia-notification-list-scroll-container'>
                    <div className='theia-notification-list'>
                        {this.state.notifications.map(notification =>
                            <NotificationComponent key={notification.messageId} notification={notification} manager={this.props.manager} />
                        )}
                    </div>
                </PerfectScrollbar>
            </div>
        );
    }

}
