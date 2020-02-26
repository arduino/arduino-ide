import { DebugConfigurationManager } from "@theia/debug/lib/browser/debug-configuration-manager";
import { injectable } from "inversify";

@injectable()
export class ArduinoDebugConfigurationManager extends DebugConfigurationManager {

    get defaultDebugger(): Promise<string | undefined> {
        return this.debug.getDebuggersForLanguage('ino').then(debuggers => {
            if (debuggers.length === 0)
                return undefined;
            return debuggers[0].type;
        });
    }

    protected async selectDebugType(): Promise<string | undefined> {
        const widget = this.editorManager.currentEditor;
        if (!widget) {
            return this.defaultDebugger;
        }
        const { languageId } = widget.editor.document;
        const debuggers = await this.debug.getDebuggersForLanguage(languageId);
        if (debuggers.length === 0) {
            return this.defaultDebugger;
        }
        return this.quickPick.show(debuggers.map(
            ({ label, type }) => ({ label, value: type }),
            { placeholder: 'Select Environment' })
        );
    }

    async createDefaultConfiguration(): Promise<void> {
        const { model } = this;
        if (model) {
            await this.doCreate(model);
            await this.updateModels();
        }
    }

}
