import { injectable } from "inversify";
import { EditorWidgetFactory } from "@theia/editor/lib/browser/editor-widget-factory";
import URI from "@theia/core/lib/common/uri";
import { EditorWidget } from "@theia/editor/lib/browser";

@injectable()
export class CustomEditorWidgetFactory extends EditorWidgetFactory {

    protected async createEditor(uri: URI): Promise<EditorWidget> {
        const icon = await this.labelProvider.getIcon(uri);
        return this.editorProvider(uri).then(textEditor => {
            const newEditor = new EditorWidget(textEditor, this.selectionService);
            newEditor.id = this.id + ':' + uri.toString();
            newEditor.title.closable = false;
            newEditor.title.label = this.labelProvider.getName(uri);
            newEditor.title.iconClass = icon + ' file-icon';
            newEditor.title.caption = this.labelProvider.getLongName(uri);
            return newEditor;
        });
    }

}