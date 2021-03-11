import { injectable } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { MEMORY_TEXT } from '@theia/search-in-workspace/lib/browser/in-memory-text-resource';
import { SearchInWorkspaceFileNode, SearchInWorkspaceResultTreeWidget as TheiaSearchInWorkspaceResultTreeWidget } from '@theia/search-in-workspace/lib/browser/search-in-workspace-result-tree-widget';

/**
 * Workaround for https://github.com/eclipse-theia/theia/pull/9192/.
 */
@injectable()
export class SearchInWorkspaceResultTreeWidget extends TheiaSearchInWorkspaceResultTreeWidget {

    protected async createReplacePreview(node: SearchInWorkspaceFileNode): Promise<URI> {
        const fileUri = new URI(node.fileUri).withScheme('file');
        const openedEditor = this.editorManager.all.find(({ editor }) => editor.uri.toString() === fileUri.toString());
        let content: string;
        if (openedEditor) {
            content = openedEditor.editor.document.getText();
        } else {
            const resource = await this.fileResourceResolver.resolve(fileUri);
            content = await resource.readContents();
        }

        const lines = content.split('\n');
        node.children.map(l => {
            const leftPositionedNodes = node.children.filter(rl => rl.line === l.line && rl.character < l.character);
            const diff = (this._replaceTerm.length - this.searchTerm.length) * leftPositionedNodes.length;
            const start = lines[l.line - 1].substr(0, l.character - 1 + diff);
            const end = lines[l.line - 1].substr(l.character - 1 + diff + l.length);
            lines[l.line - 1] = start + this._replaceTerm + end;
        });

        return fileUri.withScheme(MEMORY_TEXT).withQuery(lines.join('\n'));
    }
}
