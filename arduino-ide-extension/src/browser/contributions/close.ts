import { inject, injectable } from 'inversify';
import { toArray } from '@phosphor/algorithm';
import { remote } from 'electron';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SaveAsSketch } from './save-as-sketch';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, URI } from './contribution';

/**
 * Closes the `current` closeable editor, or any closeable current widget from the main area, or the current sketch window.
 */
@injectable()
export class Close extends SketchContribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    protected shell: ApplicationShell;

    onStart(app: FrontendApplication): void {
        this.shell = app.shell;
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(Close.Commands.CLOSE, {
            execute: async () => {

                // Close current editor if closeable.
                const { currentEditor } = this.editorManager;
                if (currentEditor && currentEditor.title.closable) {
                    currentEditor.close();
                    return;
                }

                // Close current widget from the main area if possible.
                const { currentWidget } = this.shell;
                if (currentWidget) {
                    const currentWidgetInMain = toArray(this.shell.mainPanel.widgets()).find(widget => widget === currentWidget);
                    if (currentWidgetInMain && currentWidgetInMain.title.closable) {
                        return currentWidgetInMain.close();
                    }
                }

                // Close the sketch (window).
                const sketch = await this.sketchServiceClient.currentSketch();
                if (!sketch) {
                    return;
                }
                const isTemp = await this.sketchService.isTemp(sketch);
                const uri = await this.sketchServiceClient.currentSketchFile();
                if (!uri) {
                    return;
                }
                if (isTemp && await this.wasTouched(uri)) {
                    const { response } = await remote.dialog.showMessageBox({
                        type: 'question',
                        buttons: ["Don't Save", 'Cancel', 'Save'],
                        message: 'Do you want to save changes to this sketch before closing?',
                        detail: "If you don't save, your changes will be lost."
                    });
                    if (response === 1) { // Cancel
                        return;
                    }
                    if (response === 2) { // Save
                        const saved = await this.commandService.executeCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH.id, { openAfterMove: false, execOnlyIfTemp: true });
                        if (!saved) { // If it was not saved, do bail the close.
                            return;
                        }
                    }
                }
                window.close();
            }
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
            commandId: Close.Commands.CLOSE.id,
            label: 'Close',
            order: '5'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: Close.Commands.CLOSE.id,
            keybinding: 'CtrlCmd+W'
        });
    }

    /**
     * If the file was ever touched/modified. We get this based on the `version` of the monaco model.
     */
    protected async wasTouched(uri: string): Promise<boolean> {
        const editorWidget = await this.editorManager.getByUri(new URI(uri));
        if (editorWidget) {
            const { editor } = editorWidget;
            if (editor instanceof MonacoEditor) {
                const versionId = editor.getControl().getModel()?.getVersionId();
                if (Number.isInteger(versionId) && versionId! > 1) {
                    return true;
                }
            }
        }
        return false;
    }

}

export namespace Close {
    export namespace Commands {
        export const CLOSE: Command = {
            id: 'arduino-close'
        };
    }
}
