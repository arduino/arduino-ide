import { inject, injectable } from 'inversify';
import { remote } from 'electron';
import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, URI } from './contribution';
import { SaveAsSketch } from './save-as-sketch';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class CloseSketch extends SketchContribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(CloseSketch.Commands.CLOSE_SKETCH, {
            execute: async () => {
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
            commandId: CloseSketch.Commands.CLOSE_SKETCH.id,
            label: 'Close',
            order: '5'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: CloseSketch.Commands.CLOSE_SKETCH.id,
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

export namespace CloseSketch {
    export namespace Commands {
        export const CLOSE_SKETCH: Command = {
            id: 'arduino-close-sketch'
        };
    }
}
