import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import type { EditorOpenerOptions } from '@theia/editor/lib/browser/editor-manager';
import { Later } from '../../common/nls';
import { SketchesError } from '../../common/protocol';
import {
  Command,
  CommandRegistry,
  SketchContribution,
  URI,
} from './contribution';
import { SaveAsSketch } from './save-as-sketch';

@injectable()
export class OpenSketchFiles extends SketchContribution {
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
    } catch (err) {
      if (SketchesError.NotFound.is(err)) {
        this.openFallbackSketch();
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
    if (!widget || forceOpen) {
      return this.editorManager.open(
        new URI(uri),
        options ?? {
          mode: 'reveal',
          preview: false,
          counter: 0,
        }
      );
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
