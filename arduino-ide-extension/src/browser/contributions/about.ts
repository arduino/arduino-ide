import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import { remote } from 'electron';
import { isOSX, isWindows } from '@theia/core/lib/common/os';
import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import {
  Contribution,
  Command,
  MenuModelRegistry,
  CommandRegistry,
} from './contribution';
import { ArduinoMenus } from '../menu/arduino-menus';
import { ConfigService } from '../../common/protocol';
import { nls } from '@theia/core/lib/browser/nls';

@injectable()
export class About extends Contribution {
  @inject(ClipboardService)
  protected readonly clipboardService: ClipboardService;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(About.Commands.ABOUT_APP, {
      execute: () => this.showAbout(),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.HELP__ABOUT_GROUP, {
      commandId: About.Commands.ABOUT_APP.id,
      label: nls.localize(
        'arduino/about/label',
        'About {0}',
        this.applicationName
      ),
      order: '0',
    });
  }

  async showAbout(): Promise<void> {
    const {
      version,
      commit,
      status: cliStatus,
    } = await this.configService.getVersion();
    const buildDate = this.buildDate;
    const detail = (showAll: boolean) =>
      nls.localize(
        'arduino/about/detail',
        'Version: {0}\nDate: {1}{2}\nCLI Version: {3}{4} [{5}]\n\n{6}',
        remote.app.getVersion(),
        buildDate ? buildDate : nls.localize('', 'dev build'),
        buildDate && showAll ? ` (${this.ago(buildDate)})` : '',
        version,
        cliStatus ? ` ${cliStatus}` : '',
        commit,
        nls.localize(
          'arduino/about/copyright',
          'Copyright © {0} Arduino SA',
          new Date().getFullYear().toString()
        )
      );
    const ok = nls.localize('vscode/issueMainService/ok', 'OK');
    const copy = nls.localize('vscode/textInputActions/copy', 'Copy');
    const buttons = !isWindows && !isOSX ? [copy, ok] : [ok, copy];
    const { response } = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        message: `${this.applicationName}`,
        title: `${this.applicationName}`,
        type: 'info',
        detail: detail(true),
        buttons,
        noLink: true,
        defaultId: buttons.indexOf(ok),
        cancelId: buttons.indexOf(ok),
      }
    );

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
      return result === 1
        ? nls.localize(
            'vscode/date/date.fromNow.minutes.singular.ago',
            '{0} minute ago',
            result.toString()
          )
        : nls.localize(
            'vscode/date/date.fromNow.minutes.plural.ago',
            '{0} minutes ago',
            result.toString()
          );
    }
    result = now.diff(other, 'hour');
    if (result < 25) {
      return result === 1
        ? nls.localize(
            'vscode/date/date.fromNow.hours.singular.ago',
            '{0} hour ago',
            result.toString()
          )
        : nls.localize(
            'vscode/date/date.fromNow.hours.plural.ago',
            '{0} hours ago',
            result.toString()
          );
    }
    result = now.diff(other, 'day');
    if (result < 8) {
      return result === 1
        ? nls.localize(
            'vscode/date/date.fromNow.days.singular.ago',
            '{0} day ago',
            result.toString()
          )
        : nls.localize(
            'vscode/date/date.fromNow.days.plural.ago',
            '{0} days ago',
            result.toString()
          );
    }
    result = now.diff(other, 'week');
    if (result < 5) {
      return result === 1
        ? nls.localize(
            'vscode/date/date.fromNow.weeks.singular.ago',
            '{0} week ago',
            result.toString()
          )
        : nls.localize(
            'vscode/date/date.fromNow.weeks.plural.ago',
            '{0} weeks ago',
            result.toString()
          );
    }
    result = now.diff(other, 'month');
    if (result < 13) {
      return result === 1
        ? nls.localize(
            'vscode/date/date.fromNow.months.singular.ago',
            '{0} month ago',
            result.toString()
          )
        : nls.localize(
            'vscode/date/date.fromNow.months.plural.ago',
            '{0} months ago',
            result.toString()
          );
    }
    result = now.diff(other, 'year');
    return result === 1
      ? nls.localize(
          'vscode/date/date.fromNow.years.singular.ago',
          '{0} year ago',
          result.toString()
        )
      : nls.localize(
          'vscode/date/date.fromNow.years.plural.ago',
          '{0} years ago',
          result.toString()
        );
  }
}

export namespace About {
  export namespace Commands {
    export const ABOUT_APP: Command = {
      id: 'arduino-about',
    };
  }
}
