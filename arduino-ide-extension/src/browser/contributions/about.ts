import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { isOSX, isWindows } from '@theia/core/lib/common/os';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { Contribution, Command, MenuModelRegistry, CommandRegistry } from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ConfigService } from '../../common/protocol';

@injectable()
export class About extends Contribution {

    @inject(ClipboardService)
    protected readonly clipboardService: ClipboardService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(About.Commands.ABOUT_APP, {
            execute: () => this.showAbout()
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        // On macOS we will get the `Quit ${YOUR_APP_NAME}` menu item natively, no need to duplicate it. 
        registry.registerMenuAction(ArduinoMenus.HELP__ABOUT_GROUP, {
            commandId: About.Commands.ABOUT_APP.id,
            label: `About${isOSX ? ` ${this.applicationName}` : ''}`,
            order: '0'
        });
    }

    async showAbout(): Promise<void> {
        const ideStatus = FrontendApplicationConfigProvider.get()['status'];
        const { version, commit, status: cliStatus } = await this.configService.getVersion();
        const detail = `
Version: ${remote.app.getVersion()}
CLI Version: ${version}${cliStatus ? ` ${cliStatus}` : ''} [${commit}]

Copyright © ${new Date().getFullYear()} Arduino SA 
`;
        const ok = 'OK';
        const copy = 'Copy';
        const buttons = !isWindows && !isOSX ? [copy, ok] : [ok, copy];
        const { response } = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            message: `${this.applicationName}${ideStatus ? ` – ${ideStatus}` : ''}`,
            title: `${this.applicationName}${ideStatus ? ` – ${ideStatus}` : ''}`,
            type: 'info',
            detail,
            buttons,
            noLink: true,
            defaultId: buttons.indexOf(ok),
            cancelId: buttons.indexOf(ok)
        });

        if (buttons[response] === copy) {
            await this.clipboardService.writeText(detail);
        }
    }

    protected get applicationName(): string {
        return FrontendApplicationConfigProvider.get().applicationName;
    }

}

export namespace About {
    export namespace Commands {
        export const ABOUT_APP: Command = {
            id: 'arduino-about'
        };
    }
}
