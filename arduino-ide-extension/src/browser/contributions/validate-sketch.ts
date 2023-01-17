import * as remote from '@theia/core/electron-shared/@electron/remote';
import { Dialog } from '@theia/core/lib/browser/dialogs';
import { nls } from '@theia/core/lib/common/nls';
import { Deferred, waitForEvent } from '@theia/core/lib/common/promise-util';
import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { CurrentSketch } from '../sketches-service-client-impl';
import { CloudSketchContribution } from './cloud-contribution';
import { Sketch, URI } from './contribution';
import { SaveAsSketch } from './save-as-sketch';

@injectable()
export class ValidateSketch extends CloudSketchContribution {
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
      const sketch = await this.sketchesService.createNewSketch();
      this.workspaceService.open(new URI(sketch.uri), {
        preserveWindow: true,
      });
    }
  }

  /**
   * Returns with an array of actions the user has to perform to fix the invalid sketch.
   */
  private validateSketch(
    sketch: Sketch,
    dataDirUri: URI | undefined
  ): FixAction[] {
    // sketch code file validation errors first as they do not require window reload
    const actions = Sketch.uris(sketch)
      .filter((uri) => uri !== sketch.mainFileUri)
      .map((uri) => new URI(uri))
      .filter((uri) => Sketch.Extensions.CODE_FILES.includes(uri.path.ext))
      .map((uri) => ({
        uri,
        error: this.doValidate(sketch, dataDirUri, uri.path.name),
      }))
      .filter(({ error }) => Boolean(error))
      .map((object) => <{ uri: URI; error: string }>object)
      .map(({ uri, error }) => ({
        execute: async () => {
          const unknown =
            (await this.promptRenameSketchFile(uri, error)) &&
            (await this.commandService.executeCommand(
              WorkspaceCommands.FILE_RENAME.id,
              uri
            ));
          return !!unknown;
        },
      }));

    // sketch folder + main sketch file last as it requires a `Save as...` and the window reload
    const sketchFolderName = new URI(sketch.uri).path.base;
    const sketchFolderNameError = this.doValidate(
      sketch,
      dataDirUri,
      sketchFolderName
    );
    if (sketchFolderNameError) {
      actions.push({
        execute: async () => {
          const unknown =
            (await this.promptRenameSketch(sketch, sketchFolderNameError)) &&
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
      });
    }
    return actions;
  }

  private doValidate(
    sketch: Sketch,
    dataDirUri: URI | undefined,
    toValidate: string
  ): string | undefined {
    const cloudUri = this.createFeatures.isCloud(sketch, dataDirUri);
    return cloudUri
      ? Sketch.validateCloudSketchFolderName(toValidate)
      : Sketch.validateSketchFolderName(toValidate);
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
    const maybeDataDirUri = this.configService.tryGetDataDirUri();
    const [sketch, dataDirUri] = await Promise.all([
      this.currentSketch(),
      maybeDataDirUri ??
        waitForEvent(this.configService.onDidChangeDataDirUri, 5_000),
    ]);
    const fixActions = this.validateSketch(sketch, dataDirUri);
    for (const fixAction of fixActions) {
      const result = await fixAction.execute();
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async promptRenameSketch(
    sketch: Sketch,
    error: string
  ): Promise<boolean> {
    return this.prompt(
      nls.localize(
        'arduino/validateSketch/renameSketchFolderTitle',
        'Invalid sketch name'
      ),
      nls.localize(
        'arduino/validateSketch/renameSketchFolderMessage',
        "The sketch '{0}' cannot be used. {1} To get rid of this message, rename the sketch. Do you want to rename the sketch now?",
        sketch.name,
        error
      )
    );
  }

  private async promptRenameSketchFile(
    uri: URI,
    error: string
  ): Promise<boolean> {
    return this.prompt(
      nls.localize(
        'arduino/validateSketch/renameSketchFileTitle',
        'Invalid sketch filename'
      ),
      nls.localize(
        'arduino/validateSketch/renameSketchFileMessage',
        "The sketch file '{0}' cannot be used. {1} Do you want to rename the sketch file now?",
        uri.path.base,
        error
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
