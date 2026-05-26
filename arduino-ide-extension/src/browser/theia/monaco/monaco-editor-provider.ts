import { LOCKED_CLASS, lock } from '@theia/core/lib/browser/widgets/widget';
import { DiffUris } from '@theia/core/lib/browser/diff-uris';
import { CommandRegistry } from '@theia/core/lib/common/command';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import URI from '@theia/core/lib/common/uri';
import { Title, Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import * as monaco from '@theia/monaco-editor-core';
import type { ReferencesModel } from '@theia/monaco-editor-core/esm/vs/editor/contrib/gotoSymbol/browser/referencesModel';
import {
  EditorServiceOverrides,
  MonacoEditor,
} from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoDiffEditor } from '@theia/monaco/lib/browser/monaco-diff-editor';
import type { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoEditorProvider as TheiaMonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { ArduinoGitResourceScheme } from '../../git/arduino-git-resource-resolver';
import { SketchesServiceClientImpl } from '../../sketches-service-client-impl';

type CancelablePromise = Promise<ReferencesModel> & {
  cancel: () => void;
};

const ArduinoGitRefreshCommand = 'arduino-git.refresh';

interface EditorFactory {
  (
    override: EditorServiceOverrides,
    toDispose: DisposableCollection
  ): Promise<MonacoEditor>;
}

@injectable()
export class MonacoEditorProvider extends TheiaMonacoEditorProvider {
  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected override async doCreateEditor(
    uri: URI,
    factory: EditorFactory
  ): Promise<MonacoEditor> {
    const editor = await super.doCreateEditor(uri, factory);
    const toDispose = new DisposableCollection();
    toDispose.push(this.installCustomReferencesController(editor));
    toDispose.push(this.installGitDiffRevertControls(editor));
    toDispose.push(editor.onDispose(() => toDispose.dispose()));
    return editor;
  }

  protected override createMonacoDiffEditorOptions(
    original: MonacoEditorModel,
    modified: MonacoEditorModel
  ): MonacoDiffEditor.IOptions {
    return {
      ...super.createMonacoDiffEditorOptions(original, modified),
      glyphMargin: true,
      renderMarginRevertIcon: true,
    };
  }

  private installGitDiffRevertControls(editor: MonacoEditor): Disposable {
    if (
      !(editor instanceof MonacoDiffEditor) ||
      !this.isArduinoGitDiff(editor)
    ) {
      return Disposable.NULL;
    }

    const toDispose = new DisposableCollection();
    const diffEditor = editor.diffEditor;
    const modifiedEditor = diffEditor.getModifiedEditor();
    let widgets: monaco.editor.IGlyphMarginWidget[] = [];

    diffEditor.updateOptions({
      glyphMargin: true,
      renderMarginRevertIcon: true,
      renderSideBySide: true,
    });
    modifiedEditor.updateOptions({ glyphMargin: true });
    this.ensureGitDiffRevertStyle();

    const removeWidgets = () => {
      for (const widget of widgets) {
        modifiedEditor.removeGlyphMarginWidget(widget);
      }
      widgets = [];
    };
    const updateWidgets = () => {
      const changes = diffEditor.getLineChanges() ?? [];
      removeWidgets();
      widgets = changes.map((change, index) =>
        this.createGitDiffRevertWidget(editor, change, index)
      );
      for (const widget of widgets) {
        modifiedEditor.addGlyphMarginWidget(widget);
      }
    };

    toDispose.push(diffEditor.onDidUpdateDiff(updateWidgets));
    toDispose.push(Disposable.create(removeWidgets));

    window.setTimeout(updateWidgets, 0);
    return toDispose;
  }

  private createGitDiffRevertWidget(
    editor: MonacoDiffEditor,
    change: monaco.editor.ILineChange,
    index: number
  ): monaco.editor.IGlyphMarginWidget {
    const modifiedEditor = editor.diffEditor.getModifiedEditor();
    const line = this.gitDiffGlyphLine(modifiedEditor.getModel(), change);
    const label = nls.localize('arduino/git/revertChunk', 'Revert this change');
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'arduino-diff-revert-widget codicon codicon-arrow-left';
    node.title = label;
    node.setAttribute('aria-label', label);

    const stopEditorMouseHandling = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const revert = async (event: Event) => {
      stopEditorMouseHandling(event);
      if (node.classList.contains('arduino-diff-revert-widget-busy')) {
        return;
      }
      node.classList.add('arduino-diff-revert-widget-busy');
      node.disabled = true;
      try {
        await this.revertDiffChange(editor, change);
        await this.refreshGitStatus();
      } catch (err) {
        this.messageService.error(
          nls.localize(
            'arduino/git/revertChunkError',
            'Failed to revert change: {0}',
            this.errorMessage(err)
          )
        );
      } finally {
        node.disabled = false;
        node.classList.remove('arduino-diff-revert-widget-busy');
      }
    };

    node.addEventListener('mousedown', stopEditorMouseHandling);
    node.addEventListener('click', (event) => {
      void revert(event);
    });
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        void revert(event);
      }
    });

    return {
      getId: () =>
        [
          'arduino.git.diff.revert',
          index,
          line,
          change.originalStartLineNumber,
          change.modifiedStartLineNumber,
        ].join('.'),
      getDomNode: () => node,
      getPosition: () => ({
        lane: monaco.editor.GlyphMarginLane.Left,
        zIndex: 10_000,
        range: new monaco.Range(line, 1, line, 1),
      }),
    };
  }

  private gitDiffGlyphLine(
    model: monaco.editor.ITextModel | null,
    change: monaco.editor.ILineChange
  ): number {
    const lineCount = model?.getLineCount() ?? 1;
    const line =
      change.modifiedStartLineNumber ||
      change.modifiedEndLineNumber ||
      change.originalStartLineNumber ||
      1;
    return Math.min(Math.max(1, line), lineCount);
  }

  private isArduinoGitDiff(editor: MonacoDiffEditor): boolean {
    if (!DiffUris.isDiffUri(editor.uri)) {
      return false;
    }
    const [left, right] = DiffUris.decode(editor.uri);
    return (
      left.scheme === ArduinoGitResourceScheme ||
      right.scheme === ArduinoGitResourceScheme
    );
  }

  private async revertDiffChange(
    editor: MonacoDiffEditor,
    change: monaco.editor.ILineChange
  ): Promise<void> {
    const modifiedModel = editor.modifiedModel.textEditorModel;
    const originalText = this.originalTextForChange(
      editor.originalModel.textEditorModel,
      modifiedModel,
      change
    );
    modifiedModel.pushStackElement();
    modifiedModel.pushEditOperations(
      null,
      [
        {
          range: this.modifiedRangeForChange(modifiedModel, change),
          text: originalText,
          forceMoveMarkers: true,
        },
      ],
      () => null
    );
    modifiedModel.pushStackElement();
    await editor.modifiedModel.save();
    window.setTimeout(() => editor.diffEditor.updateOptions({}), 0);
  }

  private async refreshGitStatus(): Promise<void> {
    try {
      await this.commandRegistry.executeCommand(ArduinoGitRefreshCommand);
    } catch {
      // The diff action still succeeded; Git status refresh is best-effort here.
    }
  }

  private originalTextForChange(
    originalModel: monaco.editor.ITextModel,
    modifiedModel: monaco.editor.ITextModel,
    change: monaco.editor.ILineChange
  ): string {
    if (
      change.originalStartLineNumber <= 0 ||
      change.originalEndLineNumber <= 0
    ) {
      return '';
    }

    const text = originalModel
      .getLinesContent()
      .slice(change.originalStartLineNumber - 1, change.originalEndLineNumber)
      .join(modifiedModel.getEOL());
    return this.isDeletionChange(change) ||
      this.modifiedRangeIncludesTrailingEol(modifiedModel, change)
      ? `${text}${modifiedModel.getEOL()}`
      : text;
  }

  private modifiedRangeForChange(
    model: monaco.editor.ITextModel,
    change: monaco.editor.ILineChange
  ): monaco.Range {
    if (this.isDeletionChange(change)) {
      const line = this.gitDiffGlyphLine(model, change);
      return new monaco.Range(line, 1, line, 1);
    }

    const startLine = Math.max(1, change.modifiedStartLineNumber);
    const endLine = Math.min(
      change.modifiedEndLineNumber,
      model.getLineCount()
    );
    if (this.modifiedRangeIncludesTrailingEol(model, change)) {
      return new monaco.Range(startLine, 1, endLine + 1, 1);
    }
    return new monaco.Range(
      startLine,
      1,
      endLine,
      model.getLineMaxColumn(endLine)
    );
  }

  private isDeletionChange(change: monaco.editor.ILineChange): boolean {
    return (
      change.originalStartLineNumber > 0 && change.modifiedStartLineNumber <= 0
    );
  }

  private modifiedRangeIncludesTrailingEol(
    model: monaco.editor.ITextModel,
    change: monaco.editor.ILineChange
  ): boolean {
    return (
      change.modifiedEndLineNumber > 0 &&
      change.modifiedEndLineNumber < model.getLineCount()
    );
  }

  private ensureGitDiffRevertStyle(): void {
    const id = 'arduino-git-diff-revert-style';
    if (document.getElementById(id)) {
      return;
    }
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
.monaco-editor .arduino-diff-revert-change {
  display: none;
}
.monaco-editor .arduino-diff-revert-widget {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--theia-editor-foreground, #ffffff);
  cursor: pointer;
  display: flex;
  font-size: 16px;
  height: 18px;
  justify-content: center;
  margin: 0;
  opacity: 0.95;
  padding: 0;
  width: 18px;
}
.monaco-editor .arduino-diff-revert-widget:hover,
.monaco-editor .arduino-diff-revert-widget:focus {
  color: var(--theia-editorGutter-addedBackground, #89d185);
  outline: 1px solid var(--theia-focusBorder, #007fd4);
  outline-offset: -1px;
  opacity: 1;
}
.monaco-editor .arduino-diff-revert-widget-busy {
  cursor: default;
  opacity: 0.5;
}
`;
    document.head.appendChild(style);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private installCustomReferencesController(editor: MonacoEditor): Disposable {
    const control = editor.getControl();
    const referencesController: any = control.getContribution(
      'editor.contrib.referencesController'
    );
    const originalToggleWidget = referencesController.toggleWidget;
    const toDispose = new DisposableCollection();
    const toDisposeBeforeToggleWidget = new DisposableCollection();
    referencesController.toggleWidget = (
      range: monaco.Range,
      modelPromise: CancelablePromise,
      peekMode: boolean
    ) => {
      toDisposeBeforeToggleWidget.dispose();
      originalToggleWidget.bind(referencesController)(
        range,
        modelPromise,
        peekMode
      );
      if (referencesController._widget) {
        if ('onDidClose' in referencesController._widget) {
          toDisposeBeforeToggleWidget.push(
            (referencesController._widget as any).onDidClose(() =>
              toDisposeBeforeToggleWidget.dispose()
            )
          );
        }
        const preview = (referencesController._widget as any)
          ._preview as monaco.editor.ICodeEditor;
        if (preview) {
          toDisposeBeforeToggleWidget.push(
            preview.onDidChangeModel(() => this.updateReadOnlyState(preview))
          );
          this.updateReadOnlyState(preview);
        }
      }
    };
    toDispose.push(
      Disposable.create(() => toDisposeBeforeToggleWidget.dispose())
    );
    toDispose.push(
      Disposable.create(
        () => (referencesController.toggleWidget = originalToggleWidget)
      )
    );
    return toDispose;
  }

  private updateReadOnlyState(
    editor: monaco.editor.ICodeEditor | undefined
  ): void {
    if (!editor) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    const readOnly = this.sketchesServiceClient.isReadOnly(model.uri);
    editor.updateOptions({ readOnly });
  }
}

// Theia cannot dynamically set an editor to writable once it was readonly.
export function maybeUpdateReadOnlyState(
  widget: EditorWidget,
  isReadOnly: (uri: string | URI | monaco.Uri) => boolean
): void {
  const editor = widget.editor;
  if (!(editor instanceof MonacoEditor)) {
    return;
  }
  const model = editor.document;
  const oldReadOnly = model.readOnly;
  const resource = model['resource'];
  const newReadOnly = Boolean(resource.readOnly) || isReadOnly(resource.uri);
  if (oldReadOnly !== newReadOnly) {
    editor.getControl().updateOptions({ readOnly: newReadOnly });
    if (newReadOnly) {
      lock(widget.title);
    } else {
      unlock(widget.title);
    }
  }
}

function unlock(title: Title<Widget>): void {
  title.className = title.className.replace(LOCKED_CLASS, '').trim();
}
