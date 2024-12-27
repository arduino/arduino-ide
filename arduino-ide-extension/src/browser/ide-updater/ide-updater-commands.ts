import {
  Command,
  CommandContribution,
  CommandRegistry,
  MessageService,
  nls,
} from '@theia/core';
import { injectable, inject } from '@theia/core/shared/inversify';
import { IDEUpdater, UpdateInfo } from '../../common/protocol/ide-updater';
import { ResponseService } from '../../common/protocol';
import { IDEUpdaterDialog } from '../dialogs/ide-updater/ide-updater-dialog';

@injectable()
export class IDEUpdaterCommands implements CommandContribution {
  constructor(
    @inject(IDEUpdater)
    private readonly updater: IDEUpdater,
    @inject(ResponseService)
    private readonly responseService: ResponseService,
    @inject(MessageService)
    protected readonly messageService: MessageService,
    @inject(IDEUpdaterDialog)
    protected readonly updaterDialog: IDEUpdaterDialog
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdaterCommands.CHECK_FOR_UPDATES, {
      execute: this.checkForUpdates.bind(this),
    });
  }

  async checkForUpdates(initialCheck?: boolean): Promise<UpdateInfo | void> {
    // 检查是否有更新
    try {
      // 调用updater.checkForUpdates方法检查是否有更新
      const updateInfo = await this.updater.checkForUpdates(initialCheck);
      // 如果有更新，则打开更新对话框
      if (updateInfo) {
        this.updaterDialog.open(updateInfo);
      } else {
        // 如果没有更新，则显示提示信息
        this.messageService.info(
          nls.localize(
            'arduino/ide-updater/noUpdatesAvailable',
            'LingZhiLab 没有最新的更新'
          )
        );
      }
      // 返回更新信息
      return updateInfo;
    } catch (e) {
      // 如果检查更新时出错，则显示错误信息
      this.messageService.error(
        nls.localize(
          'arduino/ide-updater/errorCheckingForUpdates',
          '检查 LingzhiLab IDE 更新时出错.\n{0}',
          e.message
        )
      );
      // 将错误信息添加到输出中
      const chunk = `检查 LingzhiLab IDE 更新时出错.\n ${e.message}\n`;
      this.responseService.appendToOutput({ chunk });
    }
  }
}
export namespace IDEUpdaterCommands {
  export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand({
    id: 'arduino-check-for-ide-updates',
    label: '检查 LingZhiLab IDE 更新',
    category: 'LingZhi',
  });
}
