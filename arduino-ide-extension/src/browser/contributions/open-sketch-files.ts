import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { EditorOpenerOptions } from '@theia/editor/lib/browser/editor-manager';
import { Later } from '../../common/nls';
import { Sketch, SketchesError } from '../../common/protocol';
import {
  Command,
  CommandRegistry,
  SketchContribution,
  URI,
} from './contribution';
import { SaveAsSketch } from './save-as-sketch';
import { promptMoveSketch } from './open-sketch';
import { ApplicationError } from '@theia/core/lib/common/application-error';
import { Deferred, wait } from '@theia/core/lib/common/promise-util';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { ContextKeyService as VSCodeContextKeyService } from '@theia/monaco-editor-core/esm/vs/platform/contextkey/browser/contextKeyService';

@injectable()
export class OpenSketchFiles extends SketchContribution {
  @inject(VSCodeContextKeyService)
  private readonly contextKeyService: VSCodeContextKeyService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSketchFiles.Commands.OPEN_SKETCH_FILES, {
      execute: (uri: URI) => this.openSketchFiles(uri),
    });
    registry.registerCommand(OpenSketchFiles.Commands.ENSURE_OPENED, {
      execute: (
        uri: string,
        forceOpen?: boolean,
        options?: EditorOpenerOptions
      ) => {
        this.ensureOpened(uri, forceOpen, options);
      },
    });
  }

  private async openSketchFiles(uri: URI): Promise<void> {
    try {
      const sketch = await this.sketchService.loadSketch(uri.toString());
      const { mainFileUri, rootFolderFileUris } = sketch;
      for (const uri of [mainFileUri, ...rootFolderFileUris]) {
        await this.ensureOpened(uri);
      }
      if (mainFileUri.endsWith('.pde')) {
        const message = nls.localize(
          'arduino/common/oldFormat',
          "The '{0}' still uses the old `.pde` format. Do you want to switch to the new `.ino` extension?",
          sketch.name
        );
        const yes = nls.localize('vscode/extensionsUtils/yes', 'Yes');
        this.messageService.info(message, Later, yes).then((answer) => {
          if (answer === yes) {
            this.commandService.executeCommand(
              SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
              {
                execOnlyIfTemp: false,
                openAfterMove: true,
                wipeOriginal: false,
              }
            );
          }
        });
      }
      const { workspaceError } = this.workspaceService;
      // This happens when the IDE2 has been started (from either a terminal or clicking on an `ino` file) with a /path/to/invalid/sketch. (#964)
      if (SketchesError.InvalidName.is(workspaceError)) {
        await this.promptMove(workspaceError);
      }
    } catch (err) {
      // This happens when the user gracefully closed IDE2, all went well
      // but the main sketch file was renamed outside of IDE2 and when the user restarts the IDE2
      // the workspace path still exists, but the sketch path is not valid anymore. (#964)
      if (SketchesError.InvalidName.is(err)) {
        const movedSketch = await this.promptMove(err);
        if (!movedSketch) {
          // If user did not accept the move, or move was not possible, force reload with a fallback.
          return this.openFallbackSketch();
        }
      }

      if (SketchesError.NotFound.is(err)) {
        return this.openFallbackSketch();
      } else {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
            ? err
            : String(err);
        this.messageService.error(message);
      }
    }
  }

  private async promptMove(
    err: ApplicationError<
      number,
      {
        invalidMainSketchUri: string;
      }
    >
  ): Promise<Sketch | undefined> {
    const { invalidMainSketchUri } = err.data;
    requestAnimationFrame(() => this.messageService.error(err.message));
    await wait(10); // let IDE2 toast the error message.
    const movedSketch = await promptMoveSketch(invalidMainSketchUri, {
      fileService: this.fileService,
      sketchService: this.sketchService,
      labelProvider: this.labelProvider,
    });
    if (movedSketch) {
      this.workspaceService.open(new URI(movedSketch.uri), {
        preserveWindow: true,
      });
      return movedSketch;
    }
    return undefined;
  }

  private async openFallbackSketch(): Promise<void> {
    const sketch = await this.sketchService.createNewSketch();
    this.workspaceService.open(new URI(sketch.uri), { preserveWindow: true });
  }

  private async ensureOpened(
    uri: string,
    forceOpen = false,
    options?: EditorOpenerOptions
  ): Promise<unknown> {
    const widget = this.editorManager.all.find(
      (widget) => widget.editor.uri.toString() === uri
    );
    const disposables = new DisposableCollection();
    if (!widget || forceOpen) {
      const deferred = new Deferred<EditorWidget>();
      disposables.push(
        this.editorManager.onCreated((editor) => {
          if (editor.editor.uri.toString() === uri) {
            if (editor.isVisible) {
              disposables.dispose();
              deferred.resolve(editor);
            } else {
              // In Theia, the promise resolves after opening the editor, but the editor is neither attached to the DOM, nor visible.
              // This is a hack to first get an event from monaco after the widget update request, then IDE2 waits for the next monaco context key event.
              // Here, the monaco context key event is not used, but this is the first event after the editor is visible in the UI.
              disposables.push(
                (editor.editor as MonacoEditor).onDidResize((dimension) => {
                  if (dimension) {
                    const isKeyOwner = (
                      arg: unknown
                    ): arg is { key: string } => {
                      if (typeof arg === 'object') {
                        const object = arg as Record<string, unknown>;
                        return typeof object['key'] === 'string';
                      }
                      return false;
                    };
                    disposables.push(
                      this.contextKeyService.onDidChangeContext((e) => {
                        // `commentIsEmpty` is the first context key change event received from monaco after the editor is for real visible in the UI.
                        if (isKeyOwner(e) && e.key === 'commentIsEmpty') {
                          deferred.resolve(editor);
                          disposables.dispose();
                        }
                      })
                    );
                  }
                })
              );
            }
          }
        })
      );
      this.editorManager.open(
        new URI(uri),
        options ?? {
          mode: 'reveal',
          preview: false,
          counter: 0,
        }
      );
      const timeout = 5_000; // number of ms IDE2 waits for the editor to show up in the UI
      const result = await Promise.race([
        deferred.promise,
        wait(timeout).then(() => {
          disposables.dispose();
          return 'timeout';
        }),
      ]);
      if (result === 'timeout') {
        console.warn(
          `Timeout after ${timeout} millis. The editor has not shown up in time. URI: ${uri}`
        );
      }
      return result;
    }
  }
}
export namespace OpenSketchFiles {
  export namespace Commands {
    export const OPEN_SKETCH_FILES: Command = {
      id: 'arduino-open-sketch-files',
    };
    export const ENSURE_OPENED: Command = {
      id: 'arduino-ensure-opened',
    };
  }
}
