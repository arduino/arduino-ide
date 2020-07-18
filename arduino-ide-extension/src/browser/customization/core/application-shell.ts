
import { injectable, inject } from 'inversify';
import { CommandService } from '@theia/core/lib/common/command';
import { ApplicationShell as TheiaApplicationShell, Widget } from '@theia/core/lib/browser';
import { EditorMode } from '../../editor-mode';
import { EditorWidget } from '@theia/editor/lib/browser';
import { SaveAsSketch } from '../../contributions/save-as-sketch';

@injectable()
export class ApplicationShell extends TheiaApplicationShell {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    protected track(widget: Widget): void {
        super.track(widget);
        if (!this.editorMode.proMode) {
            if (widget instanceof EditorWidget && widget.editor.uri.toString().endsWith('arduino-cli.yaml')) {
                return;
            }
            widget.title.closable = false;
        }
    }

    async save(): Promise<void> {
        await super.save();
        await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { execOnlyIfTemp: true, openAfterMove: true });
    }

}
