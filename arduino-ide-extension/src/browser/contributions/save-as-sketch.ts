import { inject, injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import dateFormat from 'dateformat';
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
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { WorkspaceInput } from '@theia/workspace/lib/browser';
import { StartupTask } from '../../electron-common/startup-task';
import { DeleteSketch } from './delete-sketch';

@injectable()
export class SaveAsSketch extends SketchContribution {
  @inject(ApplicationShell)
  private readonly applicationShell: ApplicationShell;

  @inject(WindowService)
  private readonly windowService: WindowService;

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
  private async saveAs(
    {
      execOnlyIfTemp,
      openAfterMove,
      wipeOriginal,
      markAsRecentlyOpened,
    }: SaveAsSketch.Options = SaveAsSketch.Options.DEFAULT
  ): Promise<boolean> {
    const [sketch, configuration] = await Promise.all([
      this.sketchServiceClient.currentSketch(),
      this.configService.getConfiguration(),
    ]);
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }

    const isTemp = await this.sketchService.isTemp(sketch);
    if (!isTemp && !!execOnlyIfTemp) {
      return false;
    }

    const sketchUri = new URI(sketch.uri);
    const sketchbookDirUri = new URI(configuration.sketchDirUri);
    // If the sketch is temp, IDE2 proposes the default sketchbook folder URI.
    // If the sketch is not temp, but not contained in the default sketchbook folder, IDE2 proposes the default location.
    // Otherwise, it proposes the parent folder of the current sketch.
    const containerDirUri = isTemp
      ? sketchbookDirUri
      : !sketchbookDirUri.isEqualOrParent(sketchUri)
      ? sketchbookDirUri
      : sketchUri.parent;
    const exists = await this.fileService.exists(
      containerDirUri.resolve(sketch.name)
    );

    // If target does not exist, propose a `directories.user`/${sketch.name} path
    // If target exists, propose `directories.user`/${sketch.name}_copy_${yyyymmddHHMMss}
    const defaultUri = containerDirUri.resolve(
      exists
        ? `${sketch.name}_copy_${dateFormat(new Date(), 'yyyymmddHHMMss')}`
        : sketch.name
    );
    const defaultPath = await this.fileService.fsPath(defaultUri);
    const { filePath, canceled } = await remote.dialog.showSaveDialog(
      remote.getCurrentWindow(),
      {
        title: nls.localize(
          'arduino/sketch/saveFolderAs',
          'Save sketch folder as...'
        ),
        defaultPath,
      }
    );
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
      if (markAsRecentlyOpened) {
        this.sketchService.markAsRecentlyOpened(workspaceUri);
      }
    }
    const options: WorkspaceInput & StartupTask.Owner = {
      preserveWindow: true,
      tasks: [],
    };
    if (workspaceUri && openAfterMove) {
      this.windowService.setSafeToShutDown();
      if (wipeOriginal || (openAfterMove && execOnlyIfTemp)) {
        options.tasks.push({
          command: DeleteSketch.Commands.DELETE_SKETCH.id,
          args: [sketch.uri],
        });
      }
      this.workspaceService.open(new URI(workspaceUri), options);
    }
    return !!workspaceUri;
  }

  private async saveOntoCopiedSketch(mainFileUri: string, sketchUri: string, newSketchUri: string): Promise<void> {
    const widgets = this.applicationShell.widgets;
    const snapshots = new Map<string, Saveable.Snapshot>();
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
    readonly markAsRecentlyOpened?: boolean;
  }
  export namespace Options {
    export const DEFAULT: Options = {
      execOnlyIfTemp: false,
      openAfterMove: true,
      wipeOriginal: false,
      markAsRecentlyOpened: false,
    };
  }
}
