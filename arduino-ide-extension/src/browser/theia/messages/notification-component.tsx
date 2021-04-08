import * as React from 'react';
import { NotificationComponent as TheiaNotificationComponent } from '@theia/messages/lib/browser/notification-component'

export class NotificationComponent extends TheiaNotificationComponent {

    render(): React.ReactNode {
        const { messageId, message, type, collapsed, expandable, source, actions } = this.props.notification;
        return (<div key={messageId} className='theia-notification-list-item'>
            <div className={`theia-notification-list-item-content ${collapsed ? 'collapsed' : ''}`}>
                <div className='theia-notification-list-item-content-main'>
                    <div className={`theia-notification-icon theia-notification-icon-${type}`} />
                    <div className='theia-notification-message'>
                        <span dangerouslySetInnerHTML={{ __html: message }} onClick={this.onMessageClick} />
                    </div>
                    <ul className='theia-notification-actions'>
                        {expandable && (
                            <li className={collapsed ? 'expand' : 'collapse'} title={collapsed ? 'Expand' : 'Collapse'}
                                data-message-id={messageId} onClick={this.onToggleExpansion} />
                        )}
                        {!this.isProgress && (<li className='clear' title='Clear' data-message-id={messageId} onClick={this.onClear} />)}
                    </ul>
                </div>
                {(source || !!actions.length) && (
                    <div className='theia-notification-list-item-content-bottom'>
                        <div className='theia-notification-source'>
                            {source && (<span>{source}</span>)}
                        </div>
                        <div className='theia-notification-buttons'>
                            {actions && actions.map((action, index) => (
                                <button key={messageId + `-action-${index}`} className='theia-button'
                                    data-message-id={messageId} data-action={action}
                                    onClick={this.onAction}>
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {this.renderProgressBar()}
        </div>);
    }

    private renderProgressBar(): React.ReactNode {
        if (!this.isProgress) {
            return undefined;
        }
        if (!Number.isNaN(this.props.notification.progress)) {
            return <div className='theia-notification-item-progress'>
                <div className='theia-notification-item-progressbar' style={{ width: `${this.props.notification.progress}%` }} />
            </div>;
        }
        return <div className='theia-progress-bar-container'>
            <div className='theia-progress-bar' />
        </div>
    }

    private get isProgress(): boolean {
        return typeof this.props.notification.progress === 'number';
    }

}
