import * as React from '@theia/core/shared/react';
import * as ReactDOM from '@theia/core/shared/react-dom';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { NotificationCenterComponent } from './notification-center-component';
import { NotificationToastsComponent } from './notification-toasts-component';
import { NotificationsRenderer as TheiaNotificationsRenderer } from '@theia/messages/lib/browser/notifications-renderer';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class NotificationsRenderer extends TheiaNotificationsRenderer {
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  @postConstruct()
  protected override init(): void {
    // Unlike Theia, IDE2 renders the notification area only when the app is ready.
    this.appStateService.reachedState('ready').then(() => {
      this.createOverlayContainer();
      this.render();
    });
  }

  protected override render(): void {
    ReactDOM.render(
      <div>
        <NotificationToastsComponent
          manager={this.manager}
          corePreferences={this.corePreferences}
        />
        <NotificationCenterComponent manager={this.manager} />
      </div>,
      this.container
    );
  }
}
