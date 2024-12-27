import { SidebarBottomMenuWidget as TheiaSidebarBottomMenuWidget } from '@theia/core/lib/browser/shell/sidebar-bottom-menu-widget';
import type { SidebarMenu } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
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
import { CommandRegistry } from '@theia/core/lib/common/command';

@injectable()
export class SidebarBottomMenuWidget extends TheiaSidebarBottomMenuWidget {
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;
  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatue: ApplicationConnectionStatusContribution;
  @inject(CommandRegistry) private readonly commandRegistry: CommandRegistry;

  @postConstruct()
  protected init(): void {
    this.toDispose.pushAll([
      this.createFeatures.onDidChangeSession(() => this.update()),
      this.connectionStatue.onOfflineStatusDidChange(() => this.update()),
    ]);
  }

  public tooberOnClick(
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    menuPath: MenuPath
  ): void {
    this.onClick(e, menuPath);
  }

  protected override onClick(
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    menuPath: MenuPath
  ): void {
    if (menuPath[0] === 'lingzhi-verify-sketch') {
      this.commandRegistry.executeCommand('lingzhi-verify-sketch');
      return;
    }
    if (menuPath[0] === 'lingzhi-upload-sketch') {
      this.commandRegistry.executeCommand('lingzhi-upload-sketch');
      return;
    }
    const button = e.currentTarget.getBoundingClientRect();
    let options = {
      menuPath,
      includeAnchorArg: false,
      anchor: {
        x: menuPath[0].includes('menubar')
          ? button.left + button.width
          : button.left + button.width,
        // Bogus y coordinate?
        // https://github.com/eclipse-theia/theia/discussions/12170
        y: menuPath[0].includes('menubar') ? button.bottom : button.top,
      },
      showDisabled: true,
    };
    this.contextMenuRenderer.render(options);
  }

  protected override render(): React.ReactNode {
    return (
      <React.Fragment>
        {this.menus.map((menu) => this.renderMenu(menu))}
      </React.Fragment>
    );
  }

  private renderMenu(menu: SidebarMenu): React.ReactNode {
    // Removes the _Settings_ (cog) icon from the left sidebar
    if (menu.id === 'settings-menu') {
      return undefined;
    }
    const arduinoAccount = menu.id === accountMenu.id;
    const picture =
      arduinoAccount &&
      this.connectionStatue.offlineStatus !== 'internet' &&
      this.createFeatures.session?.account.picture;
    const className = typeof picture === 'string' ? undefined : menu.iconClass;
    let name = menu.title;
    switch (menu.id) {
      case 'lingzhi-upload-sketch':
        name = '上传';
        break;
      case 'lingzhi-verify-sketch':
        name = '验证';
        break;
      case 'arduino-port-sketch':
        name = '连接';
        break;
    }
    return (
      <i
        key={menu.id}
        className={className}
        title={menu.title}
        onClick={(e) => this.onClick(e, menu.menuPath)}
        onMouseDown={this.onMouseDown}
        onMouseOut={this.onMouseOut}
      >
        {picture && (
          <div className="account-icon">
            <img
              src={picture}
              alt={nls.localize(
                'arduino/cloud/profilePicture',
                'Profile picture'
              )}
            />
          </div>
        )}
        <div className="lingzhi-icon-bottom">{name}</div>
      </i>
    );
  }
}
