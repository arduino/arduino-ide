import * as remote from '@theia/core/electron-shared/@electron/remote';
import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FocusTracker, Widget } from '@theia/core/lib/browser';
import { DEFAULT_WINDOW_HASH } from '@theia/core/lib/common/window';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { WorkspaceService as TheiaWorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../../../common/protocol/config-service';
import {
  SketchesService,
  Sketch,
} from '../../../common/protocol/sketches-service';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { BoardsConfig } from '../../boards/boards-config';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(LabelProvider)
  protected override readonly labelProvider: LabelProvider;

  @inject(MessageService)
  protected override readonly messageService: MessageService;

  @inject(ApplicationServer)
  protected readonly applicationServer: ApplicationServer;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  private version?: string;

  async onStart(application: FrontendApplication): Promise<void> {
    const info = await this.applicationServer.getApplicationInfo();
    this.version = info?.version;
    application.shell.onDidChangeCurrentWidget(
      this.onCurrentWidgetChange.bind(this)
    );
    const newValue = application.shell.currentWidget
      ? application.shell.currentWidget
      : null;
    this.onCurrentWidgetChange({ newValue, oldValue: null });
  }

  // Was copied from the Theia implementation.
  // Unlike the default behavior, IDE2 does not check the existence of the workspace before open.
  protected override async doGetDefaultWorkspaceUri(): Promise<
    string | undefined
  > {
    // If an empty window is explicitly requested do not restore a previous workspace.
    // Note: `window.location.hash` includes leading "#" if non-empty.
    if (window.location.hash === `#${DEFAULT_WINDOW_HASH}`) {
      window.location.hash = '';
      return undefined;
    }

    // Prefer the workspace path specified as the URL fragment, if present.
    if (window.location.hash.length > 1) {
      // Remove the leading # and decode the URI.
      const wpPath = decodeURI(window.location.hash.substring(1));
      const workspaceUri = new URI().withPath(wpPath).withScheme('file');
      // ### Customization! Here, we do no check if the workspace exists.
      return workspaceUri.toString();
    } else {
      // Else, ask the server for its suggested workspace (usually the one
      // specified on the CLI, or the most recent).
      // ### Customization! the default workspace server will create a new sketch and will return with its URI if no recent workspaces are available.
      return this.server.getMostRecentlyUsedWorkspace();
    }
  }

  // protected override getDefaultWorkspaceUri(): Promise<string | undefined> {
  //   if (this.workspaceUri) {
  //     // Avoid creating a new sketch twice
  //     return this.workspaceUri;
  //   }
  //   this.workspaceUri = (async () => {
  //     try {
  //       const hash = window.location.hash;
  //       const [recentWorkspacesPaths, recentSketches] = await Promise.all([
  //         this.server.getRecentWorkspaces(),
  //         this.sketchService
  //           .getSketches({})
  //           .then((container) =>
  //             SketchContainer.toArray(container).map((s) => s.uri)
  //           ),
  //       ]);
  //       // On Dindows, `getRecentWorkspaces` returns only file paths, not URIs as expected by the `isValid` method.
  //       const recentWorkspaces = recentWorkspacesPaths.map((e) =>
  //         VSCodeUri.file(e).toString()
  //       );
  //       const toOpen = await new ArduinoWorkspaceRootResolver({
  //         isValid: this.isValid.bind(this),
  //       }).resolve({ hash, recentWorkspaces, recentSketches });
  //       if (toOpen) {
  //         const { uri } = toOpen;
  //         await this.server.setMostRecentlyUsedWorkspace(uri);
  //         return toOpen.uri;
  //       }
  //       return (await this.sketchService.createNewSketch()).uri;
  //     } catch (err) {
  //       this.appStateService
  //         .reachedState('ready')
  //         .then(() => this.application.shell.update());
  //       this.logger.fatal(`Failed to determine the sketch directory: ${err}`);
  //       this.messageService.error(
  //         nls.localize(
  //           'theia/workspace/sketchDirectoryError',
  //           'There was an error creating the sketch directory. See the log for more details. The application will probably not work as expected.'
  //         )
  //       );
  //       return super.getDefaultWorkspaceUri();
  //     }
  //   })();
  //   return this.workspaceUri;
  // }

  protected override openNewWindow(workspacePath: string): void {
    const { boardsConfig } = this.boardsServiceProvider;
    const url = BoardsConfig.Config.setConfig(
      boardsConfig,
      new URL(window.location.href)
    ); // Set the current boards config for the new browser window.
    url.hash = workspacePath;
    this.windowService.openNewWindow(url.toString());
  }

  // private async isValid(uri: string): Promise<boolean> {
  //   const exists = await this.fileService.exists(new URI(uri));
  //   if (!exists) {
  //     return false;
  //   }
  //   return this.sketchService.isSketchFolder(uri);
  // }

  protected onCurrentWidgetChange({
    newValue,
  }: FocusTracker.IChangedArgs<Widget>): void {
    if (newValue instanceof EditorWidget) {
      const { uri } = newValue.editor;
      const currentWindow = remote.getCurrentWindow();
      currentWindow.setRepresentedFilename(uri.path.toString());
      if (Sketch.isSketchFile(uri.toString())) {
        this.updateTitle();
      } else {
        const title = this.workspaceTitle;
        const fileName = this.labelProvider.getName(uri);
        document.title = this.formatTitle(
          title ? `${title} - ${fileName}` : fileName
        );
      }
    } else {
      this.updateTitle();
    }
  }

  protected override formatTitle(title?: string): string {
    const version = this.version ? ` ${this.version}` : '';
    const name = `${this.applicationName} ${version}`;
    return title ? `${title} | ${name}` : name;
  }

  protected get workspaceTitle(): string | undefined {
    if (this.workspace) {
      return this.labelProvider.getName(this.workspace.resource);
    }
  }
}
