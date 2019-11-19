import { injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';

@injectable()
export class ArduinoShellLayoutRestorer extends ShellLayoutRestorer {

    // Workaround for https://github.com/eclipse-theia/theia/issues/6579.
    async storeLayoutAsync(app: FrontendApplication): Promise<void> {
        if (this.shouldStoreLayout) {
            try {
                this.logger.info('>>> Storing the layout...');
                const layoutData = app.shell.getLayoutData();
                const serializedLayoutData = this.deflate(layoutData);
                await this.storageService.setData(this.storageKey, serializedLayoutData);
                this.logger.info('<<< The layout has been successfully stored.');
            } catch (error) {
                await this.storageService.setData(this.storageKey, undefined);
                this.logger.error('Error during serialization of layout data', error);
            }
        }
    }

}
