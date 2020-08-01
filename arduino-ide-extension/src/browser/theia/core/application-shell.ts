
import { injectable, inject } from 'inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { CommandService } from '@theia/core/lib/common/command';
import { ApplicationShell as TheiaApplicationShell, Widget } from '@theia/core/lib/browser';
import { Sketch } from '../../../common/protocol';
import { EditorMode } from '../../editor-mode';
import { SaveAsSketch } from '../../contributions/save-as-sketch';
import { SketchesServiceClientImpl } from '../../../common/protocol/sketches-service-client-impl';

@injectable()
export class ApplicationShell extends TheiaApplicationShell {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(SketchesServiceClientImpl)
    protected readonly sketchesServiceClient: SketchesServiceClientImpl;

    protected sketch?: Sketch;

    async addWidget(widget: Widget, options: Readonly<TheiaApplicationShell.WidgetOptions> = {}): Promise<void> {
        // Get the current sketch before adding a widget. This wil trigger an update.
        this.sketch = await this.sketchesServiceClient.currentSketch();
        super.addWidget(widget, options);
    }

    async setLayoutData(layoutData: TheiaApplicationShell.LayoutData): Promise<void> {
        // I could not find other ways to get sketch in async fashion for sync `track`.
        this.sketch = await this.sketchesServiceClient.currentSketch();
        super.setLayoutData(layoutData);
    }

    protected track(widget: Widget): void {
        if (!this.editorMode.proMode && this.sketch && widget instanceof EditorWidget) {
            if (Sketch.isInSketch(widget.editor.uri, this.sketch)) {
                widget.title.closable = false;
            }
        }
        super.track(widget);
    }

    async saveAll(): Promise<void> {
        await super.saveAll();
        await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { execOnlyIfTemp: true, openAfterMove: true });
    }

}
