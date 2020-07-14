
import { injectable, inject } from 'inversify';
import { ApplicationShell, Widget, Saveable, FocusTracker, Message } from '@theia/core/lib/browser';
import { EditorWidget } from '@theia/editor/lib/browser';
import { EditorMode } from '../editor-mode';
import { CommandService } from '@theia/core';
import { ArduinoCommands } from '../arduino-commands';

@injectable()
export class ArduinoApplicationShell extends ApplicationShell {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    protected refreshBottomPanelToggleButton() {
        if (this.editorMode.proMode) {
            super.refreshBottomPanelToggleButton();
        }
    }

    protected async track(widget: Widget): Promise<void> {
        if (this.editorMode.proMode) {
            super.track(widget);
        } else {
            const tracker = (this as any).tracker as FocusTracker<Widget>;
            tracker.add(widget);
            this.disableClose(Saveable.apply(widget));
            if (ApplicationShell.TrackableWidgetProvider.is(widget)) {
                for (const toTrack of await widget.getTrackableWidgets()) {
                    tracker.add(toTrack);
                    this.disableClose(Saveable.apply(toTrack));
                }
                if (widget.onDidChangeTrackableWidgets) {
                    widget.onDidChangeTrackableWidgets(widgets => widgets.forEach(w => this.track(w)));
                }
            }
        }
    }

    async save(): Promise<void> {
        await super.save();
        await this.commandService.executeCommand(ArduinoCommands.SAVE_SKETCH_AS.id, { execOnlyIfTemp: true });
    }

    private disableClose(widget: Widget | undefined): void {
        if (widget instanceof EditorWidget) {
            const onCloseRequest = (_: Message) => {
                // NOOP
            };
            (widget as any).onCloseRequest = onCloseRequest.bind(widget);
        }
    }

}
