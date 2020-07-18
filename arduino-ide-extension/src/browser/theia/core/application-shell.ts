
import { injectable, inject } from 'inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { CommandService } from '@theia/core/lib/common/command';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';
import { ApplicationShell as TheiaApplicationShell, Widget } from '@theia/core/lib/browser';
import { EditorMode } from '../../editor-mode';
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
            if (widget instanceof EditorWidget) {
                // Always allow closing the whitelisted files.
                // TODO: It would be better to blacklist the sketch files only.
                if (['tasks.json',
                    'launch.json',
                    'settings.json',
                    'arduino-cli.yaml'].some(fileName => widget.editor.uri.toString().endsWith(fileName))) {
                    return;
                }
            }
            if (widget instanceof PreferencesWidget) {
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
