/* eslint-disable prettier/prettier */
import { FileSystemWatcherErrorHandler } from '@theia/filesystem/lib/browser/filesystem-watcher-error-handler';

export class MyFileSystemWatcherErrorHandler extends FileSystemWatcherErrorHandler {
    public override async handleError(): Promise<void> {
        if (!this.watchHandlesExhausted) {
            this.watchHandlesExhausted = true;
            if (this.isElectron()) {
                const instructionsAction = '使用说明';
                const action = await this.messageService.warn(
                    '无法在此大型工作区中监视文件更改。请按照说明链接解决此问题。',
                    { timeout: 60000 },
                    instructionsAction
                );
                if (action === instructionsAction) {
                    this.windowService.openNewWindow(this.instructionsLink, {
                        external: true,
                    });
                }
            } else {
                await this.messageService.warn(
                    '无法在此大型工作区中监视文件更改。您看到的信息可能不包括最近的文件更改。',
                    { timeout: 60000 }
                );
            }
        }
    }
}
