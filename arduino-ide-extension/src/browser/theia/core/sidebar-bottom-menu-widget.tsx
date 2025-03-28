import { SidebarBottomMenuWidget as TheiaSidebarBottomMenuWidget } from '@theia/core/lib/browser/shell/sidebar-bottom-menu-widget';
import type { SidebarMenuItem } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
import type { MenuPath } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import { accountMenu } from '../../contributions/account';
import { CreateFeatures } from '../../create/create-features';
import { ApplicationConnectionStatusContribution } from './connection-status-service';

@injectable()
export class SidebarBottomMenuWidget extends TheiaSidebarBottomMenuWidget {
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;
  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatue: ApplicationConnectionStatusContribution;

  @postConstruct()
  protected init(): void {
    this.toDispose.pushAll([
      this.createFeatures.onDidChangeSession(() => this.update()),
      this.connectionStatue.onOfflineStatusDidChange(() => this.update()),
    ]);
  }

  protected override onClick(
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    menuPath: MenuPath
  ): void {
    const button = e.currentTarget.getBoundingClientRect();
    const options = {
      menuPath,
      includeAnchorArg: false,
      anchor: {
        x: button.left + button.width,
        // Bogus y coordinate?
        // https://github.com/eclipse-theia/theia/discussions/12170
        y: button.top,
      },
      showDisabled: true,
    };
    this.contextMenuRenderer.render(options);
  }

  override renderItem(item: SidebarMenuItem): React.ReactNode {
    // Removes the _Settings_ (cog) icon from the left sidebar
    if (item.menu.id === 'settings-menu') {
      return undefined;
    }
    const arduinoAccount = item.menu.id === accountMenu.id;
    const arduinoAccountPicture =
      arduinoAccount &&
      this.connectionStatue.offlineStatus !== 'internet' &&
      this.createFeatures.session?.account.picture;

    return (
      <div
        key={item.menu.id}
        className="theia-sidebar-menu-item"
        title={item.menu.title}
        onClick={(e) => this.onClick(e, item.menu.menuPath)}
        onMouseDown={this.onMouseDown}
        onMouseEnter={(e) => this.onMouseEnter(e, item.menu.title)}
        onMouseOut={this.onMouseOut}
      >
        {arduinoAccountPicture ? (
          <i>
            <img
              className="arduino-account-picture"
              src={arduinoAccountPicture}
              alt={nls.localize(
                'arduino/cloud/profilePicture',
                'Profile picture'
              )}
            />
          </i>
        ) : (
          <i className={item.menu.iconClass} />
        )}
        {item.badge && (
          <div className="theia-badge-decorator-sidebar">{item.badge}</div>
        )}
      </div>
    );
  }
}
