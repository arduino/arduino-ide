import { injectable } from 'inversify';
import { ShellLayoutRestorer as TheiaShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';
import { inject } from '@theia/core/shared/inversify';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';

@injectable()
export class ShellLayoutRestorer extends TheiaShellLayoutRestorer {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  // Workaround for https://github.com/eclipse-theia/theia/issues/6579.
  async storeLayoutAsync(): Promise<void> {
    if (this.shouldStoreLayout) {
      try {
        this.logger.info('>>> Storing the layout...');
        const layoutData = this.shell.getLayoutData();
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

  async restoreLayout(): Promise<boolean> {
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

    await this.shell.setLayoutData(layoutData);
    this.logger.info('<<< The layout has been successfully restored.');
    return true;
  }
}
