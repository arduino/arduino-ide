import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
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

@injectable()
export class OpenSketchFiles extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenSketchFiles.Commands.OPEN_SKETCH_FILES, {
      execute: (uri: URI, focusMainSketchFile) =>
        this.openSketchFiles(uri, focusMainSketchFile),
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

  private async openSketchFiles(
    uri: URI,
    focusMainSketchFile = false
  ): Promise<void> {
    try {
      const sketch = await this.sketchesService.loadSketch(uri.toString());
      const { mainFileUri, rootFolderFileUris } = sketch;
      for (const uri of [mainFileUri, ...rootFolderFileUris]) {
        await this.ensureOpened(uri);
      }
      if (focusMainSketchFile) {
        await this.ensureOpened(mainFileUri, true, { mode: 'activate' });
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
    await wait(250); // let IDE2 open the editor and toast the error message, then open the modal dialog
    const movedSketch = await promptMoveSketch(invalidMainSketchUri, {
      fileService: this.fileService,
      sketchesService: this.sketchesService,
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
    const sketch = await this.sketchesService.createNewSketch();
    this.workspaceService.open(new URI(sketch.uri), { preserveWindow: true });
  }

  private async ensureOpened(
    uri: string,
    forceOpen = false,
    options?: EditorOpenerOptions
  ): Promise<EditorWidget | undefined> {
    const widget = this.editorManager.all.find(
      (widget) => widget.editor.uri.toString() === uri
    );
    if (widget && !forceOpen) {
      return widget;
    }

    const disposables = new DisposableCollection();
    const deferred = new Deferred<EditorWidget>();
    // An editor can be in two primary states:
    // - The editor is not yet opened. The `widget` is `undefined`. With `editorManager#open`, Theia will create an editor and fire an `editorManager#onCreated` event.
    // - The editor is opened. Can be active, current, or open.
    //   - If the editor has the focus (the cursor blinks in the editor): it's the active editor.
    //   - If the editor does not have the focus (the focus is on a different widget or the context menu is opened in the editor): it's the current editor.
    //   - If the editor is not the top editor in the main area, it's opened.
    if (!widget) {
      // If the widget is `undefined`, IDE2 expects one `onCreate` event. Subscribe to the `onCreated` event
      // and resolve the promise with the editor only when the new editor's visibility changes.
      disposables.push(
        this.editorManager.onCreated((editor) => {
          if (editor.editor.uri.toString() === uri) {
            if (editor.isAttached && editor.isVisible) {
              deferred.resolve(editor);
            } else {
              disposables.push(
                editor.onDidChangeVisibility((visible) => {
                  if (visible) {
                    // wait an animation frame. although the visible and attached props are true the editor is not there.
                    // let the browser render the widget
                    setTimeout(
                      () =>
                        requestAnimationFrame(() => deferred.resolve(editor)),
                      0
                    );
                  }
                })
              );
            }
          }
        })
      );
    }

    this.editorManager
      .open(
        new URI(uri),
        options ?? {
          mode: 'reveal',
          preview: false,
          counter: 0,
        }
      )
      .then((editorWidget) => {
        // If the widget was defined, it was already opened.
        // The editor is expected to be attached to the shell and visible in the UI.
        // The deferred promise does not have to wait for the `editorManager#onCreated` event.
        // It can resolve earlier.
        if (widget) {
          deferred.resolve(editorWidget);
        }
      });

    const timeout = this.preferences['arduino.sketch.editorOpenTimeout']; // number of ms IDE2 waits for the editor to show up in the UI
    const result: EditorWidget | undefined | 'timeout' = await Promise.race([
      deferred.promise,
      wait(timeout).then(() => {
        disposables.dispose();
        return 'timeout' as const;
      }),
    ]);
    if (result === 'timeout') {
      console.warn(
        `Timeout after ${timeout} millis. The editor has not shown up in time. URI: ${uri}`
      );
      return undefined;
    }
    return result;
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
