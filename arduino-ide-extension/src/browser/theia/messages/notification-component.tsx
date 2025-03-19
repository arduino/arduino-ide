import React from '@theia/core/shared/react';
import { NotificationComponent as TheiaNotificationComponent } from '@theia/messages/lib/browser/notification-component';
import { nls } from '@theia/core/lib/common';
import { codicon } from '@theia/core/lib/browser';
import { sanitize } from 'dompurify';

export class NotificationComponent extends TheiaNotificationComponent {
  override render(): React.ReactNode {
    const { messageId, message, type, collapsed, expandable, source, actions } =
      this.props.notification;
    return (
      <div key={messageId} className="theia-notification-list-item">
        <div
          className={`theia-notification-list-item-content ${
            collapsed ? 'collapsed' : ''
          }`}
        >
          <div className="theia-notification-list-item-content-main">
            <div
              className={`theia-notification-icon ${codicon(type)} ${type}`}
            />
            <div className="theia-notification-message">
              <span
                dangerouslySetInnerHTML={{ __html: sanitize(message) }}
                onClick={this.onMessageClick}
              />
            </div>
            <ul className="theia-notification-actions">
              {expandable && (
                <li
                  className={
                    codicon('chevron-down') + collapsed
                      ? ' expand'
                      : ' collapse'
                  }
                  title={
                    collapsed
                      ? nls.localize('theia/messages/expand', 'Expand')
                      : nls.localize('theia/messages/collapse', 'Collapse')
                  }
                  data-message-id={messageId}
                  onClick={this.onToggleExpansion}
                />
              )}
              {!this.isProgress && (
                <li
                  className={codicon('close', true)}
                  title={nls.localize('vscode/abstractTree/clear', 'Clear')}
                  data-message-id={messageId}
                  onClick={this.onClear}
                />
              )}
            </ul>
          </div>
          {(source || !!actions.length) && (
            <div className="theia-notification-list-item-content-bottom">
              <div className="theia-notification-source">
                {source && <span>{source}</span>}
              </div>
              <div className="theia-notification-buttons">
                {actions &&
                  actions.map((action, index) => (
                    <button
                      key={messageId + `-action-${index}`}
                      className={`theia-button ${
                        index !== actions.length - 1 ? 'secondary' : ''
                      }`}
                      data-message-id={messageId}
                      data-action={action}
                      onClick={this.onAction}
                    >
                      {action}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        {this.renderProgressBar()}
      </div>
    );
  }

  private renderProgressBar(): React.ReactNode {
    if (!this.isProgress) {
      return undefined;
    }
    if (!Number.isNaN(this.props.notification.progress)) {
      return (
        <div className="theia-notification-item-progress">
          <div
            className="theia-notification-item-progressbar"
            style={{
              width: `${this.props.notification.progress}%`,
            }}
          />
        </div>
      );
    }
    return (
      <div className="theia-progress-bar-container">
        <div className="theia-progress-bar" />
      </div>
    );
  }

  private get isProgress(): boolean {
    return typeof this.props.notification.progress === 'number';
  }
}
