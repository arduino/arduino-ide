import * as remote from '@theia/core/electron-shared/@electron/remote';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { NavigatableWidget } from '@theia/core/lib/browser/navigatable-types';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { WindowTitleUpdater as TheiaWindowTitleUpdater } from '@theia/core/lib/browser/window/window-title-updater';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import { isOSX } from '@theia/core/lib/common/os';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigServiceClient } from '../../config/config-service-client';
import { CreateFeatures } from '../../create/create-features';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';

@injectable()
export class WindowTitleUpdater extends TheiaWindowTitleUpdater {
  @inject(ApplicationServer)
  private readonly applicationServer: ApplicationServer;
  @inject(ApplicationShell)
  private readonly applicationShell: ApplicationShell;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;
  @inject(ConfigServiceClient)
  private readonly configServiceClient: ConfigServiceClient;
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;
  @inject(EditorManager)
  private readonly editorManager: EditorManager;

  private readonly applicationName =
    FrontendApplicationConfigProvider.get().applicationName;
  private readonly toDispose = new DisposableCollection();

  private previousRepresentedFilename: string | undefined;
  private applicationVersion: string | undefined;
  private hasCloudPrefix: boolean | undefined;

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

  override onStart(app: FrontendApplication): void {
    super.onStart(app);
    this.toDispose.pushAll([
      this.sketchesServiceClient.onCurrentSketchDidChange(() =>
        this.maybeSetCloudPrefix()
      ),
      this.configServiceClient.onDidChangeDataDirUri(() =>
        this.maybeSetCloudPrefix()
      ),
    ]);
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  protected override handleWidgetChange(widget?: Widget | undefined): void {
    if (isOSX) {
      this.maybeUpdateRepresentedFilename(widget);
    }
    // Unlike Theia, IDE2 does not want to show in the window title if the current widget is dirty or not.
    // Hence, IDE2 does not track widgets but updates the window title on current widget change.
    this.updateTitleWidget(widget);
  }

  protected override updateTitleWidget(widget?: Widget | undefined): void {
    let activeEditorShort = '';
    let rootName = this.workspaceService.workspace?.name ?? '';
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
    if (this.hasCloudPrefix) {
      rootName = `[${nls.localize(
        'arduino/title/cloud',
        'Cloud'
      )}] ${rootName}`;
    }
    this.windowTitleService.update({ rootName, appName, activeEditorShort });
  }

  private maybeUpdateRepresentedFilename(widget?: Widget | undefined): void {
    if (widget instanceof EditorWidget) {
      const { uri } = widget.editor;
      const filename = uri.path.toString();
      // Do not necessarily require the current window if not needed. It's a synchronous, blocking call.
      if (this.previousRepresentedFilename !== filename) {
        const currentWindow = remote.getCurrentWindow();
        currentWindow.setRepresentedFilename(uri.path.toString());
        this.previousRepresentedFilename = filename;
      }
    }
  }

  private maybeSetCloudPrefix(): void {
    if (typeof this.hasCloudPrefix === 'boolean') {
      return;
    }
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }
    const dataDirUri = this.configServiceClient.tryGetDataDirUri();
    if (!dataDirUri) {
      return;
    }
    this.hasCloudPrefix = this.createFeatures.isCloud(sketch, dataDirUri);
    if (typeof this.hasCloudPrefix === 'boolean') {
      const editor =
        this.editorManager.activeEditor ?? this.editorManager.currentEditor;
      if (editor) {
        this.updateTitleWidget(editor);
      }
    }
  }
}
