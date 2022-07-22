import { NavigatableWidget } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { WindowTitleUpdater as TheiaWindowTitleUpdater } from '@theia/core/lib/browser/window/window-title-updater';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';

@injectable()
export class WindowTitleUpdater extends TheiaWindowTitleUpdater {
  @inject(ApplicationServer)
  private readonly applicationServer: ApplicationServer;
  @inject(ApplicationShell)
  private readonly applicationShell: ApplicationShell;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  private readonly applicationName =
    FrontendApplicationConfigProvider.get().applicationName;
  private applicationVersion: string | undefined;

  @postConstruct()
  protected init(): void {
    setTimeout(
      () =>
        this.applicationServer.getApplicationInfo().then((info) => {
          this.applicationVersion = info?.version;
          if (this.applicationVersion) {
            this.handleWidgetChange(this.applicationShell.currentWidget);
          }
        }),
      0
    );
  }

  protected override handleWidgetChange(widget?: Widget | undefined): void {
    // Unlike Theia, IDE2 does not want to show in the window title if the current widget is dirty or now.
    // Hence, IDE2 does not track widgets but updates the window title on current widget change.
    this.updateTitleWidget(widget);
  }

  protected override updateTitleWidget(widget?: Widget | undefined): void {
    let activeEditorShort = '';
    const rootName = this.workspaceService.workspace?.name ?? '';
    let appName = `${this.applicationName}${
      this.applicationVersion ? ` ${this.applicationVersion}` : ''
    }`;
    if (rootName) {
      appName = ` | ${appName}`;
    }
    const uri = NavigatableWidget.getUri(widget);
    if (uri) {
      const base = uri.path.base;
      // Do not show the basename of the main sketch file. Only other sketch file names are visible in the title.
      if (`${rootName}.ino` !== base) {
        activeEditorShort = ` - ${base} `;
      }
    }
    this.windowTitleService.update({ rootName, appName, activeEditorShort });
  }
}
