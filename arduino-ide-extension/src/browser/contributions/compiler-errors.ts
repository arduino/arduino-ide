import {
  Command,
  CommandRegistry,
  Disposable,
  DisposableCollection,
  Emitter,
  ILogger,
  MaybeArray,
  MaybePromise,
  nls,
  notEmpty,
} from '@theia/core';
import type {
  ApplicationShell,
  FrontendApplication,
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import type {
  Location,
  Range,
} from '@theia/core/shared/vscode-languageserver-protocol';
import {
  EditorWidget,
  TextDocumentChangeEvent,
} from '@theia/editor/lib/browser';
import {
  EditorDecoration,
  TrackedRangeStickiness,
} from '@theia/editor/lib/browser/decorations/editor-decoration';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import * as monaco from '@theia/monaco-editor-core';
import type { ITextModel } from '@theia/monaco-editor-core/esm/vs/editor/common/model';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoToProtocolConverter } from '@theia/monaco/lib/browser/monaco-to-protocol-converter';
import { ProtocolToMonacoConverter } from '@theia/monaco/lib/browser/protocol-to-monaco-converter';
import { OutputUri } from '@theia/output/lib/common/output-uri';
import { CoreError } from '../../common/protocol/core-service';
import { ErrorRevealStrategy } from '../arduino-preferences';
import { ArduinoOutputSelector, InoSelector } from '../selectors';
import { Contribution } from './contribution';
import { CoreErrorHandler } from './core-error-handler';

interface ErrorDecorationRef {
  /**
   * This is the unique ID of the decoration given by `monaco`.
   */
  readonly id: string;
  /**
   * The resource this decoration belongs to.
   */
  readonly uri: string;
}
export namespace ErrorDecorationRef {
  export function is(arg: unknown): arg is ErrorDecorationRef {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'uri' in object &&
        typeof object['uri'] === 'string' &&
        'id' in object &&
        typeof object['id'] === 'string'
      );
    }
    return false;
  }
  export function sameAs(
    left: ErrorDecorationRef,
    right: ErrorDecorationRef
  ): boolean {
    return left.id === right.id && left.uri === right.uri;
  }
}

interface ErrorDecoration extends ErrorDecorationRef {
  /**
   * The range of the error location the error in the compiler output from the CLI.
   */
  readonly rangesInOutput: monaco.Range[];
}
namespace ErrorDecoration {
  export function rangeOf(
    editorOrModel: MonacoEditor | ITextModel | undefined,
    decorations: ErrorDecoration
  ): monaco.Range | undefined;
  export function rangeOf(
    editorOrModel: MonacoEditor | ITextModel | undefined,
    decorations: ErrorDecoration[]
  ): (monaco.Range | undefined)[];
  export function rangeOf(
    editorOrModel: MonacoEditor | ITextModel | undefined,
    decorations: ErrorDecoration | ErrorDecoration[]
  ): MaybePromise<MaybeArray<monaco.Range | undefined>> {
    if (editorOrModel) {
      const allDecorations = getAllDecorations(editorOrModel);
      if (allDecorations) {
        if (Array.isArray(decorations)) {
          return decorations.map(({ id: decorationId }) =>
            findRangeOf(decorationId, allDecorations)
          );
        } else {
          return findRangeOf(decorations.id, allDecorations);
        }
      }
    }
    return Array.isArray(decorations)
      ? decorations.map(() => undefined)
      : undefined;
  }
  function findRangeOf(
    decorationId: string,
    allDecorations: { id: string; range?: monaco.Range }[]
  ): monaco.Range | undefined {
    return allDecorations.find(
      ({ id: candidateId }) => candidateId === decorationId
    )?.range;
  }
  function getAllDecorations(
    editorOrModel: MonacoEditor | ITextModel
  ): { id: string; range?: monaco.Range }[] {
    if (editorOrModel instanceof MonacoEditor) {
      const model = editorOrModel.getControl().getModel();
      if (!model) {
        return [];
      }
      return model.getAllDecorations();
    }
    return editorOrModel.getAllDecorations();
  }
}

@injectable()
export class CompilerErrors
  extends Contribution
  implements monaco.languages.CodeLensProvider, monaco.languages.LinkProvider
{
  @inject(ILogger)
  @named('compiler-errors')
  private readonly errorLogger: ILogger;
  @inject(EditorManager)
  private readonly editorManager: EditorManager;
  @inject(ProtocolToMonacoConverter)
  private readonly p2m: ProtocolToMonacoConverter;
  @inject(MonacoToProtocolConverter)
  private readonly m2p: MonacoToProtocolConverter;
  @inject(CoreErrorHandler)
  private readonly coreErrorHandler: CoreErrorHandler;

  private revealStrategy = ErrorRevealStrategy.Default;
  private experimental = false;

  private readonly errors: ErrorDecoration[] = [];
  private readonly onDidChangeEmitter = new monaco.Emitter<this>();
  private readonly currentErrorDidChangEmitter = new Emitter<ErrorDecoration>();
  private readonly onCurrentErrorDidChange =
    this.currentErrorDidChangEmitter.event;
  private readonly toDisposeOnCompilerErrorDidChange =
    new DisposableCollection();

  private shell: ApplicationShell | undefined;
  private currentError: ErrorDecoration | undefined;
  private get currentErrorIndex(): number {
    const current = this.currentError;
    if (!current) {
      return -1;
    }
    return this.errors.findIndex((error) =>
      ErrorDecorationRef.sameAs(error, current)
    );
  }

  override onStart(app: FrontendApplication): void {
    this.shell = app.shell;
    monaco.languages.registerCodeLensProvider(InoSelector, this);
    monaco.languages.registerLinkProvider(ArduinoOutputSelector, this);
    this.coreErrorHandler.onCompilerErrorsDidChange((errors) =>
      this.handleCompilerErrorsDidChange(errors)
    );
    this.onCurrentErrorDidChange(async (error) => {
      const monacoEditor = await this.monacoEditor(error.uri);
      const monacoRange = ErrorDecoration.rangeOf(monacoEditor, error);
      if (!monacoRange) {
        console.warn(
          'compiler-errors',
          `Could not find range of decoration: ${error.id}`
        );
        return;
      }
      const range = this.m2p.asRange(monacoRange);
      const editor = await this.revealLocationInEditor({
        uri: error.uri,
        range,
      });
      if (!editor) {
        console.warn(
          'compiler-errors',
          `Failed to mark error ${error.id} as the current one.`
        );
      } else {
        const monacoEditor = this.monacoEditor(editor);
        if (monacoEditor) {
          monacoEditor.cursor = range.start;
        }
      }
    });
  }

  override onReady(): MaybePromise<void> {
    this.preferences.ready.then(() => {
      this.experimental = Boolean(
        this.preferences['arduino.compile.experimental']
      );
      const strategy = this.preferences['arduino.compile.revealRange'];
      this.revealStrategy = ErrorRevealStrategy.is(strategy)
        ? strategy
        : ErrorRevealStrategy.Default;
      this.preferences.onPreferenceChanged(
        ({ preferenceName, newValue, oldValue }) => {
          if (newValue === oldValue) {
            return;
          }
          switch (preferenceName) {
            case 'arduino.compile.revealRange': {
              this.revealStrategy = ErrorRevealStrategy.is(newValue)
                ? newValue
                : ErrorRevealStrategy.Default;
              return;
            }
            case 'arduino.compile.experimental': {
              this.experimental = Boolean(newValue);
              this.onDidChangeEmitter.fire(this);
              return;
            }
          }
        }
      );
    });
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(CompilerErrors.Commands.NEXT_ERROR, {
      execute: () => {
        const index = this.currentErrorIndex;
        if (index < 0) {
          console.warn(
            'compiler-errors',
            `Could not advance to next error. Unknown current error.`
          );
          return;
        }
        const nextError =
          this.errors[index === this.errors.length - 1 ? 0 : index + 1];
        return this.markAsCurrentError(nextError, {
          forceReselect: true,
          reveal: true,
        });
      },
      isEnabled: () =>
        this.experimental && !!this.currentError && this.errors.length > 1,
    });
    registry.registerCommand(CompilerErrors.Commands.PREVIOUS_ERROR, {
      execute: () => {
        const index = this.currentErrorIndex;
        if (index < 0) {
          console.warn(
            'compiler-errors',
            `Could not advance to previous error. Unknown current error.`
          );
          return;
        }
        const previousError =
          this.errors[index === 0 ? this.errors.length - 1 : index - 1];
        return this.markAsCurrentError(previousError, {
          forceReselect: true,
          reveal: true,
        });
      },
      isEnabled: () =>
        this.experimental && !!this.currentError && this.errors.length > 1,
    });
    registry.registerCommand(CompilerErrors.Commands.MARK_AS_CURRENT, {
      execute: (arg: unknown) => {
        if (ErrorDecorationRef.is(arg)) {
          return this.markAsCurrentError(
            { id: arg.id, uri: new URI(arg.uri).toString() }, // Make sure the URI fragments are encoded. On Windows, `C:` is encoded as `C%3A`.
            { forceReselect: true, reveal: true }
          );
        }
      },
      isEnabled: () => !!this.errors.length,
    });
  }

  get onDidChange(): monaco.IEvent<this> {
    return this.onDidChangeEmitter.event;
  }

  async provideCodeLenses(
    model: monaco.editor.ITextModel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.CodeLensList> {
    const lenses: monaco.languages.CodeLens[] = [];
    if (
      this.experimental &&
      this.currentError &&
      this.currentError.uri === model.uri.toString() &&
      this.errors.length > 1
    ) {
      const monacoEditor = await this.monacoEditor(model.uri);
      const range = ErrorDecoration.rangeOf(monacoEditor, this.currentError);
      if (range) {
        lenses.push(
          {
            range,
            command: {
              id: CompilerErrors.Commands.PREVIOUS_ERROR.id,
              title: nls.localize(
                'arduino/editor/previousError',
                'Previous Error'
              ),
              arguments: [this.currentError],
            },
          },
          {
            range,
            command: {
              id: CompilerErrors.Commands.NEXT_ERROR.id,
              title: nls.localize('arduino/editor/nextError', 'Next Error'),
              arguments: [this.currentError],
            },
          }
        );
      }
    }
    return {
      lenses,
      dispose: () => {
        /* NOOP */
      },
    };
  }

  async provideLinks(
    model: monaco.editor.ITextModel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.ILinksList> {
    const links: monaco.languages.ILink[] = [];
    if (
      model.uri.scheme === OutputUri.SCHEME &&
      model.uri.path === '/Arduino'
    ) {
      links.push(
        ...this.errors
          .filter((decoration) => !!decoration.rangesInOutput.length)
          .map(({ rangesInOutput, id, uri }) =>
            rangesInOutput.map(
              (range) =>
                <monaco.languages.ILink>{
                  range,
                  url: monaco.Uri.parse(`command://`).with({
                    query: JSON.stringify({ id, uri }),
                    path: CompilerErrors.Commands.MARK_AS_CURRENT.id,
                  }),
                  tooltip: nls.localize(
                    'arduino/editor/revealError',
                    'Reveal Error'
                  ),
                }
            )
          )
          .reduce((acc, curr) => acc.concat(curr), [])
      );
    } else {
      console.warn('unexpected URI: ' + model.uri.toString());
    }
    return { links };
  }

  async resolveLink(
    link: monaco.languages.ILink,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: monaco.CancellationToken
  ): Promise<monaco.languages.ILink | undefined> {
    if (!this.experimental) {
      return undefined;
    }
    const { url } = link;
    if (url) {
      const candidateUri = new URI(
        typeof url === 'string' ? url : url.toString()
      );
      const candidateId = candidateUri.path.toString();
      const error = this.errors.find((error) => error.id === candidateId);
      if (error) {
        const monacoEditor = await this.monacoEditor(error.uri);
        const range = ErrorDecoration.rangeOf(monacoEditor, error);
        if (range) {
          return {
            range,
            url: monaco.Uri.parse(error.uri),
          };
        }
      }
    }
    return undefined;
  }

  private async handleCompilerErrorsDidChange(
    errors: CoreError.ErrorLocation[]
  ): Promise<void> {
    this.errorLogger.info(
      `Handling new compiler error locations: ${JSON.stringify(errors)}`
    );
    const groupedErrors = this.groupBy(
      errors,
      (error: CoreError.ErrorLocation) => error.location.uri
    );
    this.errorLogger.info(
      `Grouped error locations: ${JSON.stringify([...groupedErrors.entries()])}`
    );
    const decorations = await this.decorateEditors(groupedErrors);
    this.errors.push(...decorations.errors);
    this.toDisposeOnCompilerErrorDidChange.pushAll([
      Disposable.create(() => (this.errors.length = 0)),
      Disposable.create(() => this.onDidChangeEmitter.fire(this)),
      ...(await Promise.all([
        decorations.dispose,
        this.trackEditors(
          groupedErrors,
          (editor) =>
            editor.onSelectionChanged((selection) =>
              this.handleSelectionChange(editor, selection)
            ),
          (editor) =>
            editor.onDispose(() =>
              this.handleEditorDidDispose(editor.uri.toString())
            ),
          (editor) =>
            editor.onDocumentContentChanged((event) =>
              this.handleDocumentContentChange(editor, event)
            )
        ),
      ])),
    ]);
    const currentError = this.errors[0];
    if (currentError) {
      await this.markAsCurrentError(currentError, {
        forceReselect: true,
        reveal: true,
      });
    }
  }

  private async decorateEditors(
    errors: Map<string, CoreError.ErrorLocation[]>
  ): Promise<{ dispose: Disposable; errors: ErrorDecoration[] }> {
    const composite = await Promise.all(
      [...errors.entries()].map(([uri, errors]) =>
        this.decorateEditor(uri, errors)
      )
    );
    return {
      dispose: new DisposableCollection(
        ...composite.map(({ dispose }) => dispose)
      ),
      errors: composite.reduce(
        (acc, { errors }) => acc.concat(errors),
        [] as ErrorDecoration[]
      ),
    };
  }

  private async decorateEditor(
    uri: string,
    errors: CoreError.ErrorLocation[]
  ): Promise<{ dispose: Disposable; errors: ErrorDecoration[] }> {
    const editor = await this.monacoEditor(uri);
    if (!editor) {
      return { dispose: Disposable.NULL, errors: [] };
    }
    const oldDecorations = editor.deltaDecorations({
      oldDecorations: [],
      newDecorations: errors.map((error) =>
        this.compilerErrorDecoration(error.location.range)
      ),
    });
    return {
      dispose: Disposable.create(() => {
        if (editor) {
          editor.deltaDecorations({
            oldDecorations,
            newDecorations: [],
          });
        }
      }),
      errors: oldDecorations.map((id, index) => ({
        id,
        uri,
        rangesInOutput: errors[index].rangesInOutput.map((range) =>
          this.p2m.asRange(range)
        ),
      })),
    };
  }

  private compilerErrorDecoration(range: Range): EditorDecoration {
    return {
      range,
      options: {
        isWholeLine: true,
        className: 'compiler-error',
        stickiness: TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    };
  }

  /**
   * Tracks the selection in all editors that have an error. If the editor selection overlaps one of the compiler error's range, mark as current error.
   */
  private handleSelectionChange(
    monacoEditor: MonacoEditor,
    selection: Range
  ): void {
    const uri = monacoEditor.uri.toString();
    const monacoSelection = this.p2m.asRange(selection);
    console.log(
      'compiler-errors',
      `Handling selection change in editor ${uri}. New (monaco) selection: ${monacoSelection.toJSON()}`
    );
    const calculatePriority = (
      candidateErrorRange: monaco.Range,
      currentSelection: monaco.Range
    ) => {
      console.trace(
        'compiler-errors',
        `Candidate error range: ${candidateErrorRange.toJSON()}`
      );
      console.trace(
        'compiler-errors',
        `Current selection range: ${currentSelection.toJSON()}`
      );
      if (candidateErrorRange.intersectRanges(currentSelection)) {
        console.trace('Intersects.');
        return { score: 2 };
      }
      if (
        candidateErrorRange.startLineNumber <=
          currentSelection.startLineNumber &&
        candidateErrorRange.endLineNumber >= currentSelection.endLineNumber
      ) {
        console.trace('Same line.');
        return { score: 1 };
      }

      console.trace('No match');
      return undefined;
    };
    const errorsPerResource = this.errors.filter((error) => error.uri === uri);
    const rangesPerResource = ErrorDecoration.rangeOf(
      monacoEditor,
      errorsPerResource
    );
    const error = rangesPerResource
      .map((range, index) => ({ error: errorsPerResource[index], range }))
      .map(({ error, range }) => {
        if (range) {
          const priority = calculatePriority(range, monacoSelection);
          if (priority) {
            return { ...priority, error };
          }
        }
        return undefined;
      })
      .filter(notEmpty)
      .sort((left, right) => right.score - left.score) // highest first
      .map(({ error }) => error)
      .shift();
    if (error) {
      this.markAsCurrentError(error);
    } else {
      console.info(
        'compiler-errors',
        `New (monaco) selection ${monacoSelection.toJSON()} does not intersect any error locations. Skipping.`
      );
    }
  }

  /**
   * This code does not deal with resource deletion, but tracks editor dispose events. It does not matter what was the cause of the editor disposal.
   * If editor closes, delete the decorators.
   */
  private handleEditorDidDispose(uri: string): void {
    let i = this.errors.length;
    // `splice` re-indexes the array. It's better to "iterate and modify" from the last element.
    while (i--) {
      const error = this.errors[i];
      if (error.uri === uri) {
        this.errors.splice(i, 1);
      }
    }
    this.onDidChangeEmitter.fire(this);
  }

  /**
   * If the text document changes in the line where compiler errors are, the compiler errors will be removed.
   */
  private handleDocumentContentChange(
    monacoEditor: MonacoEditor,
    event: TextDocumentChangeEvent
  ): void {
    const errorsPerResource = this.errors.filter(
      (error) => error.uri === event.document.uri
    );
    let editorOrModel: MonacoEditor | ITextModel = monacoEditor;
    const doc = event.document;
    if (doc instanceof MonacoEditorModel) {
      editorOrModel = doc.textEditorModel;
    }
    const rangesPerResource = ErrorDecoration.rangeOf(
      editorOrModel,
      errorsPerResource
    );
    const resolvedDecorations = rangesPerResource.map((range, index) => ({
      error: errorsPerResource[index],
      range,
    }));
    const decoratorsToRemove = event.contentChanges
      .map(({ range }) => this.p2m.asRange(range))
      .map((changedRange) =>
        resolvedDecorations
          .filter(({ range: decorationRange }) => {
            if (!decorationRange) {
              return false;
            }
            const affects =
              changedRange.startLineNumber <= decorationRange.startLineNumber &&
              changedRange.endLineNumber >= decorationRange.endLineNumber;
            console.log(
              'compiler-errors',
              `decoration range: ${decorationRange.toString()}, change range: ${changedRange.toString()}, affects: ${affects}`
            );
            return affects;
          })
          .map(({ error }) => {
            const index = this.errors.findIndex((candidate) =>
              ErrorDecorationRef.sameAs(candidate, error)
            );
            return index !== -1 ? { error, index } : undefined;
          })
          .filter(notEmpty)
      )
      .reduce((acc, curr) => acc.concat(curr), [])
      .sort((left, right) => left.index - right.index); // highest index last

    if (decoratorsToRemove.length) {
      let i = decoratorsToRemove.length;
      while (i--) {
        this.errors.splice(decoratorsToRemove[i].index, 1);
      }
      monacoEditor.getControl().deltaDecorations(
        decoratorsToRemove.map(({ error }) => error.id),
        []
      );
      this.onDidChangeEmitter.fire(this);
    }
  }

  private async trackEditors(
    errors: Map<string, CoreError.ErrorLocation[]>,
    ...track: ((editor: MonacoEditor) => Disposable)[]
  ): Promise<Disposable> {
    return new DisposableCollection(
      ...(await Promise.all(
        Array.from(errors.keys()).map(async (uri) => {
          const editor = await this.monacoEditor(uri);
          if (!editor) {
            return Disposable.NULL;
          }
          return new DisposableCollection(...track.map((t) => t(editor)));
        })
      ))
    );
  }

  private async markAsCurrentError(
    ref: ErrorDecorationRef,
    options?: { forceReselect?: boolean; reveal?: boolean }
  ): Promise<void> {
    const index = this.errors.findIndex((candidate) =>
      ErrorDecorationRef.sameAs(candidate, ref)
    );
    if (index < 0) {
      console.warn(
        'compiler-errors',
        `Failed to mark error ${
          ref.id
        } as the current one. Error is unknown. Known errors are: ${this.errors.map(
          ({ id }) => id
        )}`
      );
      return;
    }
    const newError = this.errors[index];
    if (
      options?.forceReselect ||
      !this.currentError ||
      !ErrorDecorationRef.sameAs(this.currentError, newError)
    ) {
      this.currentError = this.errors[index];
      console.log(
        'compiler-errors',
        `Current error changed to ${this.currentError.id}`
      );
      if (options?.reveal) {
        this.currentErrorDidChangEmitter.fire(this.currentError);
      }
      this.onDidChangeEmitter.fire(this);
    }
  }

  // The double editor activation logic is required: https://github.com/eclipse-theia/theia/issues/11284
  private async revealLocationInEditor(
    location: Location
  ): Promise<EditorWidget | undefined> {
    const { uri, range } = location;
    const editor = await this.editorManager.getByUri(new URI(uri), {
      mode: 'activate',
    });
    if (editor && this.shell) {
      // to avoid flickering, reveal the range here and not with `getByUri`, because it uses `at: 'center'` for the reveal option.
      // TODO: check the community reaction whether it is better to set the focus at the error marker. it might cause flickering even if errors are close to each other
      editor.editor.revealRange(range, { at: this.revealStrategy });
      const activeWidget = await this.shell.activateWidget(editor.id);
      if (!activeWidget) {
        console.warn(
          'compiler-errors',
          `editor widget activation has failed. editor widget ${editor.id} expected to be the active one.`
        );
        return editor;
      }
      if (editor !== activeWidget) {
        console.warn(
          'compiler-errors',
          `active widget was not the same as previously activated editor. editor widget ID ${editor.id}, active widget ID: ${activeWidget.id}`
        );
      }
      return editor;
    }
    console.warn(
      'compiler-errors',
      `could not find editor widget for URI: ${uri}`
    );
    return undefined;
  }

  private groupBy<K, V>(
    elements: V[],
    extractKey: (element: V) => K
  ): Map<K, V[]> {
    return elements.reduce((acc, curr) => {
      const key = extractKey(curr);
      let values = acc.get(key);
      if (!values) {
        values = [];
        acc.set(key, values);
      }
      values.push(curr);
      return acc;
    }, new Map<K, V[]>());
  }

  private monacoEditor(widget: EditorWidget): MonacoEditor | undefined;
  private monacoEditor(
    uri: string | monaco.Uri
  ): Promise<MonacoEditor | undefined>;
  private monacoEditor(
    uriOrWidget: string | monaco.Uri | EditorWidget
  ): MaybePromise<MonacoEditor | undefined> {
    if (uriOrWidget instanceof EditorWidget) {
      const editor = uriOrWidget.editor;
      if (editor instanceof MonacoEditor) {
        return editor;
      }
      return undefined;
    } else {
      return this.editorManager
        .getByUri(new URI(uriOrWidget))
        .then((editor) => {
          if (editor) {
            return this.monacoEditor(editor);
          }
          return undefined;
        });
    }
  }
}
export namespace CompilerErrors {
  export namespace Commands {
    export const NEXT_ERROR: Command = {
      id: 'arduino-editor-next-error',
    };
    export const PREVIOUS_ERROR: Command = {
      id: 'arduino-editor-previous-error',
    };
    export const MARK_AS_CURRENT: Command = {
      id: 'arduino-editor-mark-as-current-error',
    };
  }
}
