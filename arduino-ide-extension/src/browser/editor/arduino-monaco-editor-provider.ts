import { inject, injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { ConfigService } from '../../common/protocol/config-service';

@injectable()
export class ArduinoMonacoEditorProvider extends MonacoEditorProvider {

    @inject(ConfigService)
    protected readonly configService: ConfigService;
    protected dataDirUri: string | undefined;

    protected async getModel(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditorModel> {
        // `createMonacoEditorOptions` is not `async` so we ask the `dataDirUri` here.
        // https://github.com/eclipse-theia/theia/issues/6234
        const { dataDirUri } = await this.configService.getConfiguration()
        this.dataDirUri = dataDirUri;
        return super.getModel(uri, toDispose);
    }

    protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions {
        const options = this.createOptions(this.preferencePrefixes, model.uri, model.languageId);
        options.model = model.textEditorModel;
        options.readOnly = model.readOnly;
        if (this.dataDirUri) {
            options.readOnly = new URI(this.dataDirUri).isEqualOrParent(new URI(model.uri));
        }
        return options;
    }

}