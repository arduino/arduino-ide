
import { injectable, inject } from 'inversify';
import { EditorWidget } from '@theia/editor/lib/browser';
import { CommandService } from '@theia/core/lib/common/command';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';
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
        if (widget instanceof OutputWidget) {
            widget.title.closable = false; // TODO: https://arduino.slack.com/archives/C01698YT7S4/p1598011990133700
        }
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

    async addWidget(widget: Widget, options: Readonly<TheiaApplicationShell.WidgetOptions> = {}): Promise<void> {
        // By default, Theia open a widget **next** to the currently active in the target area.
        // Instead of this logic, we want to open the new widget after the last of the target area.
        if (!widget.id) {
            console.error('Widgets added to the application shell must have a unique id property.');
            return;
        }
        let ref: Widget | undefined = options.ref;
        let area: TheiaApplicationShell.Area = options.area || 'main';
        if (!ref && (area === 'main' || area === 'bottom')) {
            const tabBar = this.getTabBarFor(area);
            if (tabBar) {
                const last = tabBar.titles[tabBar.titles.length - 1];
                if (last) {
                    ref = last.owner;
                }
            }
        }
        return super.addWidget(widget, { ...options, ref });
    }

    async saveAll(): Promise<void> {
        await super.saveAll();
        const options = { execOnlyIfTemp: true, openAfterMove: true };
        await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, options);
    }

}
