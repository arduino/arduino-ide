import React from '@theia/core/shared/react';
import { NotificationComponent } from './notification-component';
import { NotificationCenterComponent as TheiaNotificationCenterComponent } from '@theia/messages/lib/browser/notification-center-component';
import { codicon } from '@theia/core/lib/browser';

const PerfectScrollbar = require('react-perfect-scrollbar');

export class NotificationCenterComponent extends TheiaNotificationCenterComponent {
  override render(): React.ReactNode {
    const empty = this.state.notifications.length === 0;
    const title = empty ? '没有新通知' : '通知';
    return (
      <div
        className={`theia-notifications-container theia-notification-center ${this.state.visibilityState === 'center' ? 'open' : 'closed'
          }`}
      >
        <div className="theia-notification-center-header">
          <div className="theia-notification-center-header-title">{title}</div>
          <div className="theia-notification-center-header-actions">
            <ul className="theia-notification-actions">
              <li
                className={codicon('chevron-down', true)}
                title={'隐藏通知中心'}
                onClick={this.onHide}
              />
              <li
                className={codicon('clear-all', true)}
                title={'全部清除'}
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
