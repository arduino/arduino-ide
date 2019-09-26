import { ApplicationShell, Widget, Saveable, FocusTracker, Message } from '@theia/core/lib/browser';
import { EditorWidget } from '@theia/editor/lib/browser';

export class ArduinoApplicationShell extends ApplicationShell {

    protected refreshBottomPanelToggleButton() {
    }

    protected async track(widget: Widget): Promise<void> {
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

    private disableClose(widget: Widget | undefined): void {
        if (widget instanceof EditorWidget) {
            const onCloseRequest = (_: Message) => {
                // NOOP
            };
            (widget as any).onCloseRequest = onCloseRequest.bind(widget);
        }
    }

}
