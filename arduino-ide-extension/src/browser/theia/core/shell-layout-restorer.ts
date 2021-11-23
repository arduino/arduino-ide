import { injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ShellLayoutRestorer as TheiaShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';

@injectable()
export class ShellLayoutRestorer extends TheiaShellLayoutRestorer {
  // Workaround for https://github.com/eclipse-theia/theia/issues/6579.
  async storeLayoutAsync(app: FrontendApplication): Promise<void> {
    if (this.shouldStoreLayout) {
      try {
        this.logger.info('>>> Storing the layout...');
        const layoutData = app.shell.getLayoutData();
        const serializedLayoutData = this.deflate(layoutData);
        await this.storageService.setData(
          this.storageKey,
          serializedLayoutData
        );
        this.logger.info('<<< The layout has been successfully stored.');
      } catch (error) {
        await this.storageService.setData(this.storageKey, undefined);
        this.logger.error('Error during serialization of layout data', error);
      }
    }
  }

  async restoreLayout(app: FrontendApplication): Promise<boolean> {
    this.logger.info('>>> Restoring the layout state...');
    const serializedLayoutData = await this.storageService.getData<string>(
      this.storageKey
    );
    if (serializedLayoutData === undefined) {
      this.logger.info('<<< Nothing to restore.');
      return false;
    }

    const layoutData = await this.inflate(serializedLayoutData);
    // workaround to remove duplicated tabs
    const filesUri: string[] = [];
    if ((layoutData as any)?.mainPanel?.main?.widgets) {
      (layoutData as any).mainPanel.main.widgets = (
        layoutData as any
      ).mainPanel.main.widgets.filter((widget: any) => {
        const uri = widget.getResourceUri().toString();
        if (filesUri.includes(uri)) {
          return false;
        }
        filesUri.push(uri);
        return true;
      });
    }

    await app.shell.setLayoutData(layoutData);
    this.logger.info('<<< The layout has been successfully restored.');
    return true;
  }
}
