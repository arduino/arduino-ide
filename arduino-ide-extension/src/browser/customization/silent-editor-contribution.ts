import {EditorContribution} from '@theia/editor/lib/browser/editor-contribution'; 
import { TextEditor } from '@theia/editor/lib/browser';

export class SilentEditorContribution extends EditorContribution {
    protected updateLanguageStatus(editor: TextEditor | undefined): void {
    }

    protected setCursorPositionStatus(editor: TextEditor | undefined): void {

    }
}