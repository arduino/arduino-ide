import { inject, injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import * as dateFormat from 'dateformat';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  URI,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { ApplicationShell, NavigatableWidget, Saveable } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';

@injectable()
export class SaveAsSketch extends SketchContribution {

  @inject(ApplicationShell)
  protected readonly applicationShell: ApplicationShell;

  @inject(EditorManager)
  protected override readonly editorManager: EditorManager;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SaveAsSketch.Commands.SAVE_AS_SKETCH, {
      execute: (args) => this.saveAs(args),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
      label: nls.localize('vscode/fileCommands/saveAs', 'Save As...'),
      order: '7',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
      keybinding: 'CtrlCmd+Shift+S',
    });
  }

  /**
   * Resolves `true` if the sketch was successfully saved as something.
   */
  async saveAs(
    {
      execOnlyIfTemp,
      openAfterMove,
      wipeOriginal,
    }: SaveAsSketch.Options = SaveAsSketch.Options.DEFAULT
  ): Promise<boolean> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }

    const isTemp = await this.sketchService.isTemp(sketch);
    if (!isTemp && !!execOnlyIfTemp) {
      return false;
    }

    // If target does not exist, propose a `directories.user`/${sketch.name} path
    // If target exists, propose `directories.user`/${sketch.name}_copy_${yyyymmddHHMMss}
    const sketchDirUri = new URI(
      (await this.configService.getConfiguration()).sketchDirUri
    );
    const exists = await this.fileService.exists(
      sketchDirUri.resolve(sketch.name)
    );
    const defaultUri = exists
      ? sketchDirUri.resolve(
          sketchDirUri
            .resolve(
              `${sketch.name}_copy_${dateFormat(new Date(), 'yyyymmddHHMMss')}`
            )
            .toString()
        )
      : sketchDirUri.resolve(sketch.name);
    const defaultPath = await this.fileService.fsPath(defaultUri);
    const { filePath, canceled } = await remote.dialog.showSaveDialog({
      title: nls.localize(
        'arduino/sketch/saveFolderAs',
        'Save sketch folder as...'
      ),
      defaultPath,
    });
    if (!filePath || canceled) {
      return false;
    }
    const destinationUri = await this.fileSystemExt.getUri(filePath);
    if (!destinationUri) {
      return false;
    }
    const workspaceUri = await this.sketchService.copy(sketch, {
      destinationUri,
    });
    if (workspaceUri) {
      await this.saveOntoCopiedSketch(sketch.mainFileUri, sketch.uri, workspaceUri);
    }
    if (workspaceUri && openAfterMove) {
      if (wipeOriginal || (openAfterMove && execOnlyIfTemp)) {
        try {
          await this.fileService.delete(new URI(sketch.uri), {
            recursive: true,
          });
        } catch {
          /* NOOP: from time to time, it's not possible to wipe the old resource from the temp dir on Windows */
        }
      }
      this.windowService.setSafeToShutDown();
      this.workspaceService.open(new URI(workspaceUri), {
        preserveWindow: true,
      });
    }
    return !!workspaceUri;
  }

  private async saveOntoCopiedSketch(mainFileUri: string, sketchUri: string, newSketchUri: string): Promise<void> {
    const widgets = this.applicationShell.widgets;
    const snapshots = new Map<string, object>();
    for (const widget of widgets) {
      const saveable = Saveable.getDirty(widget);
      const uri = NavigatableWidget.getUri(widget);
      const uriString = uri?.toString();
      let relativePath: string;
      if (uri && uriString!.includes(sketchUri) && saveable && saveable.createSnapshot) {
        // The main file will change its name during the copy process
        // We need to store the new name in the map
        if (mainFileUri === uriString) {
          const lastPart = new URI(newSketchUri).path.base + uri.path.ext;
          relativePath = '/' + lastPart;
        } else {
          relativePath = uri.toString().substring(sketchUri.length);
        }
        snapshots.set(relativePath, saveable.createSnapshot());
      }
    }
    await Promise.all(Array.from(snapshots.entries()).map(async ([path, snapshot]) => {
      const widgetUri = new URI(newSketchUri + path);
      try {
        const widget = await this.editorManager.getOrCreateByUri(widgetUri);
        const saveable = Saveable.get(widget);
        if (saveable && saveable.applySnapshot) {
          saveable.applySnapshot(snapshot);
          await saveable.save();
        }
      } catch (e) {
        console.error(e);
      }
    }));
  }
}

export namespace SaveAsSketch {
  export namespace Commands {
    export const SAVE_AS_SKETCH: Command = {
      id: 'arduino-save-as-sketch',
    };
  }
  export interface Options {
    readonly execOnlyIfTemp?: boolean;
    readonly openAfterMove?: boolean;
    /**
     * Ignored if `openAfterMove` is `false`.
     */
    readonly wipeOriginal?: boolean;
  }
  export namespace Options {
    export const DEFAULT: Options = {
      execOnlyIfTemp: false,
      openAfterMove: true,
      wipeOriginal: false,
    };
  }
}
