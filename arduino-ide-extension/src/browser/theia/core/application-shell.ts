
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

    protected track(widget: Widget): void {
        super.track(widget);
        if (!this.editorMode.proMode && widget instanceof EditorWidget) {
            // Make the editor un-closeable asynchronously.
            this.sketchesServiceClient.currentSketch().then(sketch => {
                if (sketch) {
                    if (Sketch.isInSketch(widget.editor.uri, sketch)) {
                        widget.title.closable = false;
                    }
                }
            });
        }
    }

    async saveAll(): Promise<void> {
        await super.saveAll();
        const options = { execOnlyIfTemp: true, openAfterMove: true };
        await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, options);
    }

}
