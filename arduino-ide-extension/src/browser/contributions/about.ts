import { inject, injectable } from 'inversify';
import * as moment from 'moment';
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
        registry.registerMenuAction(ArduinoMenus.HELP__ABOUT_GROUP, {
            commandId: About.Commands.ABOUT_APP.id,
            label: `About ${this.applicationName}`,
            order: '0'
        });
    }

    async showAbout(): Promise<void> {
        const { version, commit, status: cliStatus } = await this.configService.getVersion();
        const buildDate = this.buildDate;
        const detail = (showAll: boolean) => `Version: ${remote.app.getVersion()}
Date: ${buildDate ? buildDate : 'dev build'}${buildDate && showAll ? ` (${this.ago(buildDate)})` : ''}
CLI Version: ${version}${cliStatus ? ` ${cliStatus}` : ''} [${commit}]

${showAll ? `Copyright © ${new Date().getFullYear()} Arduino SA` : ''}
`;
        const ok = 'OK';
        const copy = 'Copy';
        const buttons = !isWindows && !isOSX ? [copy, ok] : [ok, copy];
        const { response } = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
            message: `${this.applicationName}`,
            title: `${this.applicationName}`,
            type: 'info',
            detail: detail(true),
            buttons,
            noLink: true,
            defaultId: buttons.indexOf(ok),
            cancelId: buttons.indexOf(ok)
        });

        if (buttons[response] === copy) {
            await this.clipboardService.writeText(detail(false).trim());
        }
    }

    protected get applicationName(): string {
        return FrontendApplicationConfigProvider.get().applicationName;
    }

    protected get buildDate(): string | undefined {
        return FrontendApplicationConfigProvider.get().buildDate;
    }

    protected ago(isoTime: string): string {
        const now = moment(Date.now());
        const other = moment(isoTime);
        let result = now.diff(other, 'minute');
        if (result < 60) {
            return result === 1 ? `${result} minute ago` : `${result} minute ago`;
        }
        result = now.diff(other, 'hour');
        if (result < 25) {
            return result === 1 ? `${result} hour ago` : `${result} hours ago`;
        }
        result = now.diff(other, 'day');
        if (result < 8) {
            return result === 1 ? `${result} day ago` : `${result} days ago`;
        }
        result = now.diff(other, 'week');
        if (result < 5) {
            return result === 1 ? `${result} week ago` : `${result} weeks ago`;
        }
        result = now.diff(other, 'month');
        if (result < 13) {
            return result === 1 ? `${result} month ago` : `${result} months ago`;
        }
        result = now.diff(other, 'year');
        return result === 1 ? `${result} year ago` : `${result} years ago`;
    }

}

export namespace About {
    export namespace Commands {
        export const ABOUT_APP: Command = {
            id: 'arduino-about'
        };
    }
}
