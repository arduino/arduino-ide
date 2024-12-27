import { ClipboardService } from '@theia/core/lib/browser/clipboard-service';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { nls } from '@theia/core/lib/common/nls';
import { isOSX, isWindows } from '@theia/core/lib/common/os';
import { inject, injectable } from '@theia/core/shared/inversify';
import moment from 'moment';
import { AppService } from '../app-service';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  Command,
  CommandRegistry,
  Contribution,
  MenuModelRegistry,
} from './contribution';

@injectable()
export class About extends Contribution {
  @inject(ClipboardService)
  private readonly clipboardService: ClipboardService;
  @inject(AppService)
  private readonly appService: AppService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(About.Commands.ABOUT_APP, {
      execute: () => this.showAbout(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.HELP__ABOUT_GROUP, {
      commandId: About.Commands.ABOUT_APP.id,
      label: nls.localize(
        'arduino/about/label',
        '关于 {0}',
        this.applicationName
      ),
      order: '0',
    });
  }

  // 定义一个异步方法，用于显示关于信息
  private async showAbout(): Promise<void> {
    // 获取应用程序信息
    const appInfo = await this.appService.info();
    // 解构赋值，获取应用程序版本、CLI版本、构建日期
    const { appVersion, cliVersion, buildDate } = appInfo;

    // 定义一个函数，用于生成详细信息
    const detail = (showAll: boolean) =>
      nls.localize(
        'arduino/about/detail',
        '版本 : {0}\nDate: {1}{2}\nCLI Version: {3}\n\n{4}',
        appVersion,
        buildDate ? buildDate : nls.localize('', 'dev build'),
        buildDate && showAll ? ` (${this.ago(buildDate)})` : '',
        cliVersion,
        nls.localize(
          'arduino/about/copyright',
          '版权 © {0} 零知实验室',
          new Date().getFullYear().toString()
        )
      );
    // 定义确定按钮和复制按钮的文本
    const ok = nls.localize('vscode/issueMainService/ok', '确定');
    const copy = nls.localize('vscode/textInputActions/copy', '复制');
    // 根据操作系统，确定按钮的顺序
    const buttons = !isWindows && !isOSX ? [copy, ok] : [ok, copy];
    // 显示消息框，包含应用程序名称、详细信息、按钮等
    const { response } = await this.dialogService.showMessageBox({
      message: `${this.applicationName}`,
      title: `${this.applicationName}`,
      type: 'info',
      detail: detail(true),
      buttons,
      noLink: true,
      defaultId: buttons.indexOf(ok),
      cancelId: buttons.indexOf(ok),
    });

    // 如果点击了复制按钮，则将详细信息复制到剪贴板
    if (buttons[response] === copy) {
      await this.clipboardService.writeText(detail(false).trim());
    }
  }

  private get applicationName(): string {
    return FrontendApplicationConfigProvider.get().applicationName;
  }

  private ago(isoTime: string): string {
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
      id: 'lingzhi-about',
    };
  }
}
