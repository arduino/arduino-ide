import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ShellLayoutRestorer as TheiaShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';
import { EditorManager } from '@theia/editor/lib/browser';

@injectable()
export class ShellLayoutRestorer extends TheiaShellLayoutRestorer {
  // The editor manager is unused in the layout restorer.
  // We inject the editor manager to achieve better logging when filtering duplicate editor tabs.
  // Feel free to remove it in later IDE2 releases if the duplicate editor tab issues do not occur anymore.
  @inject(EditorManager)
  private readonly editorManager: EditorManager;

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

  override async restoreLayout(app: FrontendApplication): Promise<boolean> {
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
    console.log(
      '>>> Filtering persisted layout data to eliminate duplicate editor tabs...'
    );
    const filesUri: string[] = [];
    if ((layoutData as any)?.mainPanel?.main?.widgets) {
      (layoutData as any).mainPanel.main.widgets = (
        layoutData as any
      ).mainPanel.main.widgets.filter((widget: any) => {
        const uri = widget.getResourceUri().toString();
        if (filesUri.includes(uri)) {
          console.log(`[SKIP]: Already visited editor URI: '${uri}'.`);
          return false;
        }
        console.log(`[OK]: Visited editor URI: '${uri}'.`);
        filesUri.push(uri);
        return true;
      });
    }
    console.log('<<< Filtered the layout data before restoration.');

    await app.shell.setLayoutData(layoutData);
    const allOpenedEditors = this.editorManager.all;
    // If any editor was visited during the layout data filtering,
    // but the editor manager does not know about opened editors, then
    // the IDE2 will show duplicate editors.
    if (filesUri.length && !allOpenedEditors.length) {
      console.warn(
        'Inconsistency detected between the editor manager and the restored layout data. Editors were detected to be open in the layout data from the previous session, but the editor manager does not know about the opened editor.'
      );
    }
    this.logger.info('<<< The layout has been successfully restored.');
    return true;
  }
}
