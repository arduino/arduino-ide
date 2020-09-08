import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FocusTracker, Widget } from '@theia/core/lib/browser';
import { WorkspaceService as TheiaWorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ConfigService } from '../../../common/protocol/config-service';
import { SketchesService } from '../../../common/protocol/sketches-service';
import { ArduinoWorkspaceRootResolver } from '../../arduino-workspace-resolver';

@injectable()
export class WorkspaceService extends TheiaWorkspaceService {

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

    private workspaceUri?: Promise<string | undefined>;
    private version?: string

    async onStart(application: FrontendApplication): Promise<void> {
        const info = await this.applicationServer.getApplicationInfo();
        this.version = info?.version;
        application.shell.onDidChangeCurrentWidget(this.onCurrentWidgetChange.bind(this));
        const newValue = application.shell.currentWidget ? application.shell.currentWidget : null;
        this.onCurrentWidgetChange({ newValue, oldValue: null });
    }

    protected getDefaultWorkspaceUri(): Promise<string | undefined> {
        if (this.workspaceUri) {
            // Avoid creating a new sketch twice
            return this.workspaceUri;
        }
        this.workspaceUri = (async () => {
            try {
                const hash = window.location.hash;
                const [recentWorkspaces, recentSketches] = await Promise.all([
                    this.server.getRecentWorkspaces(),
                    this.sketchService.getSketches().then(sketches => sketches.map(s => s.uri))
                ]);
                const toOpen = await new ArduinoWorkspaceRootResolver({
                    isValid: this.isValid.bind(this)
                }).resolve({ hash, recentWorkspaces, recentSketches });
                if (toOpen) {
                    const { uri } = toOpen;
                    await this.server.setMostRecentlyUsedWorkspace(uri);
                    return toOpen.uri;
                }
                return (await this.sketchService.createNewSketch()).uri;
            } catch (err) {
                this.logger.fatal(`Failed to determine the sketch directory: ${err}`)
                this.messageService.error(
                    'There was an error creating the sketch directory. ' +
                    'See the log for more details. ' +
                    'The application will probably not work as expected.')
                return super.getDefaultWorkspaceUri();
            }
        })();
        return this.workspaceUri;
    }

    private async isValid(uri: string): Promise<boolean> {
        const exists = await this.fileService.exists(new URI(uri));
        if (!exists) {
            return false;
        }
        return this.sketchService.isSketchFolder(uri);
    }

    protected onCurrentWidgetChange({ newValue }: FocusTracker.IChangedArgs<Widget>): void {
        if (newValue instanceof EditorWidget) {
            const { uri } = newValue.editor;
            if (uri.toString().endsWith('.ino')) {
                this.updateTitle();
            } else {
                const title = this.workspaceTitle;
                const fileName = this.labelProvider.getName(uri);
                document.title = this.formatTitle(title ? `${title} - ${fileName}` : fileName);
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
