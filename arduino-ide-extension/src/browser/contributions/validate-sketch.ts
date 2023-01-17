import * as remote from '@theia/core/electron-shared/@electron/remote';
import { Dialog } from '@theia/core/lib/browser/dialogs';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { Sketch, SketchContribution, URI } from './contribution';
import { SaveAsSketch } from './save-as-sketch';

@injectable()
export class ValidateSketch extends SketchContribution {
  override onReady(): void {
    this.validate();
  }

  private async validate(): Promise<void> {
    const result = await this.promptFixActions();
    if (!result) {
      const yes = await this.prompt(
        nls.localize('arduino/validateSketch/abortFixTitle', 'Invalid sketch'),
        nls.localize(
          'arduino/validateSketch/abortFixMessage',
          "The sketch is still invalid. Do you want to fix the remaining problems? By clicking '{0}', a new sketch will open.",
          Dialog.NO
        ),
        [Dialog.NO, Dialog.YES]
      );
      if (yes) {
        return this.validate();
      }
      const sketch = await this.sketchService.createNewSketch();
      this.workspaceService.open(new URI(sketch.uri), {
        preserveWindow: true,
      });
    }
  }

  /**
   * Returns with an array of actions the user has to perform to fix the invalid sketch.
   */
  private validateSketch(sketch: Sketch): FixAction[] {
    // sketch folder + main sketch file (requires `Save as...` and window reload)
    const sketchFolderName = new URI(sketch.uri).path.base;
    const sketchFolderNameError =
      Sketch.validateSketchFolderName(sketchFolderName);
    if (sketchFolderNameError) {
      return [
        {
          execute: async () => {
            const unknown =
              (await this.promptRenameSketch(sketch)) &&
              (await this.commandService.executeCommand(
                SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
                <SaveAsSketch.Options>{
                  markAsRecentlyOpened: true,
                  openAfterMove: true,
                  wipeOriginal: true,
                }
              ));
            return !!unknown;
          },
        },
      ];
    }

    // sketch code files (does not require window reload)
    return Sketch.uris(sketch)
      .filter((uri) => uri !== sketch.mainFileUri)
      .map((uri) => new URI(uri))
      .filter((uri) => Sketch.Extensions.CODE_FILES.includes(uri.path.ext))
      .map((uri) => ({
        uri,
        error: Sketch.validateSketchFolderName(uri.path.name),
      }))
      .filter(({ error }) => Boolean(error))
      .map(({ uri }) => ({
        execute: async () => {
          const unknown =
            (await this.promptRenameSketchFile(uri)) &&
            (await this.commandService.executeCommand(
              WorkspaceCommands.FILE_RENAME.id,
              uri
            ));
          return !!unknown;
        },
      }));
  }

  private async currentSketch(): Promise<Sketch> {
    const sketch = this.sketchServiceClient.tryGetCurrentSketch();
    if (CurrentSketch.isValid(sketch)) {
      return sketch;
    }
    const deferred = new Deferred<Sketch>();
    const disposable = this.sketchServiceClient.onCurrentSketchDidChange(
      (sketch) => {
        if (CurrentSketch.isValid(sketch)) {
          disposable.dispose();
          deferred.resolve(sketch);
        }
      }
    );
    return deferred.promise;
  }

  private async promptFixActions(): Promise<boolean> {
    const sketch = await this.currentSketch();
    const fixActions = this.validateSketch(sketch);
    for (const fixAction of fixActions) {
      const result = await fixAction.execute();
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async promptRenameSketch(sketch: Sketch): Promise<boolean> {
    return this.prompt(
      nls.localize(
        'arduino/validateSketch/renameSketchFolderTitle',
        'Invalid sketch name'
      ),
      nls.localize(
        'arduino/validateSketch/renameSketchFolderMessage',
        "The sketch '{0}' cannot be used. Sketch names must start with a letter or number, followed by letters, numbers, dashes, dots and underscores. Maximum length is 63 characters. To get rid of this message, rename the sketch. Do you want to rename the sketch now?",
        sketch.name
      )
    );
  }

  private async promptRenameSketchFile(uri: URI): Promise<boolean> {
    return this.prompt(
      nls.localize(
        'arduino/validateSketch/renameSketchFileTitle',
        'Invalid sketch filename'
      ),
      nls.localize(
        'arduino/validateSketch/renameSketchFileMessage',
        "The sketch file '{0}' cannot be used. Sketch filenames must start with a letter or number, followed by letters, numbers, dashes, dots and underscores. Maximum length is 63 characters without the file extension. To get rid of this message, rename the sketch file. Do you want to rename the sketch file now?",
        uri.path.base
      )
    );
  }

  private async prompt(
    title: string,
    message: string,
    buttons: string[] = [Dialog.CANCEL, Dialog.OK]
  ): Promise<boolean> {
    const { response } = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        title,
        message,
        type: 'warning',
        buttons,
      }
    );
    // cancel
    if (response === 0) {
      return false;
    }
    return true;
  }
}

interface FixAction {
  execute(): Promise<boolean>;
}
