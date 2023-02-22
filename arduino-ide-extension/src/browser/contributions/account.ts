import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { SidebarMenu } from '@theia/core/lib/browser/shell/sidebar-menu-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MenuPath } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CloudUserCommands, LEARN_MORE_URL } from '../auth/cloud-user-commands';
import { CreateFeatures } from '../create/create-features';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  Command,
  CommandRegistry,
  Contribution,
  MenuModelRegistry,
} from './contribution';

export const accountMenu: SidebarMenu = {
  id: 'arduino-accounts-menu',
  iconClass: 'codicon codicon-account',
  title: nls.localize('arduino/account/menuTitle', 'Arduino Cloud'),
  menuPath: ArduinoMenus.ARDUINO_ACCOUNT__CONTEXT,
  order: 0,
};

@injectable()
export class Account extends Contribution {
  @inject(WindowService)
  private readonly windowService: WindowService;
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;

  private readonly toDispose = new DisposableCollection();
  private app: FrontendApplication;

  override onStart(app: FrontendApplication): void {
    this.app = app;
    this.updateSidebarCommand();
    this.toDispose.push(
      this.createFeatures.onDidChangeEnabled((enabled) =>
        this.updateSidebarCommand(enabled)
      )
    );
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  override registerCommands(registry: CommandRegistry): void {
    const openExternal = (url: string) =>
      this.windowService.openNewWindow(url, { external: true });
    registry.registerCommand(Account.Commands.LEARN_MORE, {
      execute: () => openExternal(LEARN_MORE_URL),
      isEnabled: () => !Boolean(this.createFeatures.session),
    });
    registry.registerCommand(Account.Commands.GO_TO_PROFILE, {
      execute: () => openExternal('https://id.arduino.cc/'),
      isEnabled: () => Boolean(this.createFeatures.session),
    });
    registry.registerCommand(Account.Commands.GO_TO_CLOUD_EDITOR, {
      execute: () => openExternal('https://create.arduino.cc/editor'),
      isEnabled: () => Boolean(this.createFeatures.session),
    });
    registry.registerCommand(Account.Commands.GO_TO_IOT_CLOUD, {
      execute: () => openExternal('https://create.arduino.cc/iot/'),
      isEnabled: () => Boolean(this.createFeatures.session),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    const register = (
      menuPath: MenuPath,
      ...commands: (Command | [command: Command, menuLabel: string])[]
    ) =>
      commands.forEach((command, index) => {
        const commandId = Array.isArray(command) ? command[0].id : command.id;
        const label = Array.isArray(command) ? command[1] : command.label;
        registry.registerMenuAction(menuPath, {
          label,
          commandId,
          order: String(index),
        });
      });

    register(ArduinoMenus.ARDUINO_ACCOUNT__CONTEXT__SIGN_IN_GROUP, [
      CloudUserCommands.LOGIN,
      nls.localize('arduino/cloud/signInToCloud', 'Sign in to Arduino Cloud'),
    ]);
    register(ArduinoMenus.ARDUINO_ACCOUNT__CONTEXT__LEARN_MORE_GROUP, [
      Account.Commands.LEARN_MORE,
      nls.localize('arduino/cloud/learnMore', 'Learn more'),
    ]);
    register(
      ArduinoMenus.ARDUINO_ACCOUNT__CONTEXT__GO_TO_GROUP,
      [
        Account.Commands.GO_TO_PROFILE,
        nls.localize('arduino/account/goToProfile', 'Go to Profile'),
      ],
      [
        Account.Commands.GO_TO_CLOUD_EDITOR,
        nls.localize('arduino/account/goToCloudEditor', 'Go to Cloud Editor'),
      ],
      [
        Account.Commands.GO_TO_IOT_CLOUD,
        nls.localize('arduino/account/goToIoTCloud', 'Go to IoT Cloud'),
      ]
    );
    register(
      ArduinoMenus.ARDUINO_ACCOUNT__CONTEXT__SIGN_OUT_GROUP,
      CloudUserCommands.LOGOUT
    );
  }

  private updateSidebarCommand(
    visible: boolean = this.preferences['arduino.cloud.enabled']
  ): void {
    if (!this.app) {
      return;
    }
    const handler = this.app.shell.leftPanelHandler;
    if (visible) {
      handler.addBottomMenu(accountMenu);
    } else {
      handler.removeBottomMenu(accountMenu.id);
    }
  }
}

export namespace Account {
  export namespace Commands {
    export const GO_TO_PROFILE: Command = {
      id: 'arduino-go-to-profile',
    };
    export const GO_TO_CLOUD_EDITOR: Command = {
      id: 'arduino-go-to-cloud-editor',
    };
    export const GO_TO_IOT_CLOUD: Command = {
      id: 'arduino-go-to-iot-cloud',
    };
    export const LEARN_MORE: Command = {
      id: 'arduino-learn-more',
    };
  }
}
