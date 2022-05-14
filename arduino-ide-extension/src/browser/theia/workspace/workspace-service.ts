import * as remote from '@theia/core/electron-shared/@electron/remote';
import { injectable, inject } from 'inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FocusTracker, Widget } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { WorkspaceService as TheiaWorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../../../common/protocol/config-service';
import {
  SketchesService,
  Sketch,
  SketchContainer,
} from '../../../common/protocol/sketches-service';
import { ArduinoWorkspaceRootResolver } from '../../arduino-workspace-resolver';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { BoardsConfig } from '../../boards/boards-config';
import { nls } from '@theia/core/lib/common';
import { URI as VSCodeUri } from '@theia/core/shared/vscode-uri';
import { duration } from '../../../common/decorators';
import { FileSystemExt } from '../../../common/protocol';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {
  @inject(FileSystemExt)
  protected readonly fileSystemExt: FileSystemExt;

  @inject(SketchesService)
  protected readonly sketchService: SketchesService;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  @inject(ApplicationServer)
  protected readonly applicationServer: ApplicationServer;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  private application: FrontendApplication;
  private workspaceUri?: Promise<string | undefined>;
  private version?: string;

  @duration({ name: 'workspace-service#init' })
  protected async init(): Promise<void> {
    super.init(); // we do not wait here!
  }

  async onStart(application: FrontendApplication): Promise<void> {
    this.application = application;
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

  @duration()
  protected getDefaultWorkspaceUri(): Promise<string | undefined> {
    if (this.workspaceUri) {
      // Avoid creating a new sketch twice
      return this.workspaceUri;
    }
    this.workspaceUri = (async () => {
      try {
        const hash = window.location.hash;
        const toOpen = await new ArduinoWorkspaceRootResolver({
          isValid: this.isValid.bind(this),
        }).resolve({
          hash,
          recentWorkspaceUris: () => this.getRecentWorkspaceUris(),
          recentSketchUris: () => this.getRecentSketchUris(),
        });
        if (toOpen) {
          const { uri } = toOpen;
          this.setMostRecentlyUsedWorkspace(uri); // No await
          return toOpen.uri;
        }
        return (await this.sketchService.createNewSketch()).uri;
      } catch (err) {
        console.log('ERR', err);

        this.appStateService
          .reachedState('ready')
          .then(() => this.application.shell.update());
        this.logger.fatal(`Failed to determine the sketch directory: ${err}`);
        this.messageService.error(
          nls.localize(
            'theia/workspace/sketchDirectoryError',
            'There was an error creating the sketch directory. See the log for more details. The application will probably not work as expected.'
          )
        );
        return super.getDefaultWorkspaceUri();
      }
    })();
    return this.workspaceUri;
  }

  @duration()
  private setMostRecentlyUsedWorkspace(uri: string) {
    return this.server.setMostRecentlyUsedWorkspace(uri);
  }

  @duration()
  private async getRecentSketchUris(): Promise<string[]> {
    return this.sketchService
      .getSketches({})
      .then((container) =>
        SketchContainer.toArray(container).map((s) => s.uri)
      );
  }

  @duration()
  private async getRecentWorkspaceUris(): Promise<string[]> {
    return (
      this.server
        .getRecentWorkspaces()
        // On Windows, `getRecentWorkspaces` returns only file paths, not URIs as expected by the `isValid` method. (akitta: they're not file path but `path` of the URI.))
        .then((workspaceUris) =>
          workspaceUris
            .map((raw) => VSCodeUri.file(raw))
            .map((uri) => uri.toString())
        )
    );
  }

  protected openNewWindow(workspacePath: string): void {
    const { boardsConfig } = this.boardsServiceProvider;
    const url = BoardsConfig.Config.setConfig(
      boardsConfig,
      new URL(window.location.href)
    ); // Set the current boards config for the new browser window.
    url.hash = workspacePath;
    this.windowService.openNewWindow(url.toString());
  }

  @duration()
  private async isValid(uri: string): Promise<boolean> {
    return this.fileSystemExt.exists(uri);
  }

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

  protected formatTitle(title?: string): string {
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
