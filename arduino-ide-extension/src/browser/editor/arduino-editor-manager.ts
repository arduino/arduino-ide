import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser/editor-manager';
import { ConfigService } from '../../common/protocol/config-service';
import { EditorWidget } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class ArduinoEditorManager extends EditorManager {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    async open(uri: URI, options?: EditorOpenerOptions): Promise<EditorWidget> {
        const [widget, readOnly] = await Promise.all([super.open(uri, options), this.isReadOnly(uri)]);
        if (readOnly) {
            const { editor } = widget;
            if (editor instanceof MonacoEditor) {
                const codeEditor = editor.getControl();
                codeEditor.updateOptions({ readOnly });
            }
        }
        return widget;
    }

    protected async isReadOnly(uri: URI): Promise<boolean> {
        const [config, configFileUri] = await Promise.all([
            this.configService.getConfiguration(),
            this.configService.getCliConfigFileUri()
        ]);
        if (new URI(configFileUri).toString(true) === uri.toString(true)) {
            return false;
        }
        return new URI(config.dataDirUri).isEqualOrParent(uri)
    }

}
