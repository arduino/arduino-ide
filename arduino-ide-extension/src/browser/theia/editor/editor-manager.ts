import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorManager as TheiaEditorManager, EditorOpenerOptions } from '@theia/editor/lib/browser/editor-manager';
import { ConfigService } from '../../../common/protocol/config-service';
import { EditorWidget } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class EditorManager extends TheiaEditorManager {

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
        const config = await this.configService.getConfiguration();
        return new URI(config.dataDirUri).isEqualOrParent(uri)
    }

}
