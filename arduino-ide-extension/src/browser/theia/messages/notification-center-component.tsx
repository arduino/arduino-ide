import React from '@theia/core/shared/react';
import { NotificationComponent } from './notification-component';
import { NotificationCenterComponent as TheiaNotificationCenterComponent } from '@theia/messages/lib/browser/notification-center-component';
import { nls } from '@theia/core/lib/common';
import { codicon } from '@theia/core/lib/browser';

const PerfectScrollbar = require('react-perfect-scrollbar');

export class NotificationCenterComponent extends TheiaNotificationCenterComponent {
  override render(): React.ReactNode {
    const empty = this.state.notifications.length === 0;
    const title = empty
      ? nls.localize(
          'vscode/notificationsCenter/notificationsEmpty',
          'NO NEW NOTIFICATIONS'
        )
      : nls.localize(
          'vscode/notificationsCenter/notifications',
          'NOTIFICATIONS'
        );
    return (
      <div
        className={`theia-notifications-container theia-notification-center ${
          this.state.visibilityState === 'center' ? 'open' : 'closed'
        }`}
      >
        <div className="theia-notification-center-header">
          <div className="theia-notification-center-header-title">{title}</div>
          <div className="theia-notification-center-header-actions">
            <ul className="theia-notification-actions">
              <li
                className={codicon('chevron-down', true)}
                title={nls.localize(
                  'vscode/notificationsStatus/hideNotifications',
                  'Hide Notification Center'
                )}
                onClick={this.onHide}
              />
              <li
                className={codicon('clear-all', true)}
                title={nls.localize(
                  'vscode/notificationsCommands/clearAllNotifications',
                  'Clear All'
                )}
                onClick={this.onClearAll}
              />
            </ul>
          </div>
        </div>
        <PerfectScrollbar className="theia-notification-list-scroll-container">
          <div className="theia-notification-list">
            {this.state.notifications.map((notification) => (
              <NotificationComponent
                key={notification.messageId}
                notification={notification}
                manager={this.props.manager}
              />
            ))}
          </div>
        </PerfectScrollbar>
      </div>
    );
  }
}
