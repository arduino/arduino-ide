import { open } from '@theia/core/lib/browser/opener-service';
import { nls } from '@theia/core/lib/common';
import {
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { Path } from '@theia/core/lib/common/path';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import {
  WorkspaceCommandContribution as TheiaWorkspaceCommandContribution,
  WorkspaceCommands,
} from '@theia/workspace/lib/browser/workspace-commands';
import { Sketch, SketchesService } from '../../../common/protocol';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../../common/protocol/sketches-service-client-impl';
import { WorkspaceInputDialog } from './workspace-input-dialog';

@injectable()
export class WorkspaceCommandContribution extends TheiaWorkspaceCommandContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(SketchesService)
  private readonly sketchService: SketchesService;
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;

  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.unregisterCommand(WorkspaceCommands.NEW_FILE);
    registry.registerCommand(
      WorkspaceCommands.NEW_FILE,
      this.newWorkspaceRootUriAwareCommandHandler({
        execute: (uri) => this.newFile(uri),
      })
    );
    registry.unregisterCommand(WorkspaceCommands.FILE_RENAME);
    registry.registerCommand(
      WorkspaceCommands.FILE_RENAME,
      this.newUriAwareCommandHandler({
        execute: (uri) => this.renameFile(uri),
      })
    );
  }

  private async newFile(uri: URI | undefined): Promise<void> {
    if (!uri) {
      return;
    }
    const parent = await this.getDirectory(uri);
    if (!parent) {
      return;
    }

    const parentUri = parent.resource;
    const dialog = new WorkspaceInputDialog(
      {
        title: nls.localize('theia/workspace/fileNewName', 'Name for new file'),
        parentUri,
        validate: (name) => this.validateFileName(name, parent, true),
      },
      this.labelProvider
    );

    const name = await dialog.open();
    if (!name) {
      return;
    }
    const nameWithExt = this.maybeAppendInoExt(name);
    const fileUri = parentUri.resolve(nameWithExt);
    await this.fileService.createFile(fileUri);
    this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
    open(this.openerService, fileUri);
  }

  protected override async validateFileName(
    userInput: string,
    parent: FileStat,
    recursive = false
  ): Promise<string> {
    // If name does not have extension or ends with trailing dot (from IDE 1.x), treat it as an .ino file.
    // If has extension,
    //  - if unsupported extension -> error
    //  - if has a code file extension -> apply folder name validation without the extension and use the Theia-based validation
    //  - if has any additional file extension -> use the default Theia-based validation
    const fileInput = parseFileInput(userInput);
    const { name, extension } = fileInput;
    if (!Sketch.Extensions.ALL.includes(extension)) {
      return invalidExtension(extension);
    }
    let errorMessage: string | undefined = undefined;
    if (Sketch.Extensions.CODE_FILES.includes(extension)) {
      errorMessage = Sketch.validateSketchFolderName(name);
    }
    return errorMessage ?? super.validateFileName(userInput, parent, recursive);
  }

  private maybeAppendInoExt(name: string): string {
    if (!name) {
      return '';
    }
    if (name.trim().length) {
      if (name.indexOf('.') === -1) {
        return `${name}.ino`;
      }
      if (name.lastIndexOf('.') === name.length - 1) {
        return `${name.slice(0, -1)}.ino`;
      }
    }
    return name;
  }

  protected async renameFile(uri: URI | undefined): Promise<unknown> {
    if (!uri) {
      return;
    }
    const sketch = await this.sketchesServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return;
    }

    // file belongs to another sketch, do not allow rename
    const parentSketch = await this.sketchService.getSketchFolder(
      uri.toString()
    );
    if (parentSketch && parentSketch.uri !== sketch.uri) {
      return;
    }

    if (uri.toString() === sketch.mainFileUri) {
      const options = {
        execOnlyIfTemp: false,
        openAfterMove: true,
        wipeOriginal: true,
      };
      return await this.commandService.executeCommand<string>(
        'arduino-save-as-sketch',
        options
      );
    }
    const parent = await this.getParent(uri);
    if (!parent) {
      return;
    }
    const initialValue = uri.path.base;
    const parentUri = parent.resource;

    const dialog = new WorkspaceInputDialog(
      {
        title: nls.localize('theia/workspace/newFileName', 'New name for file'),
        initialValue,
        parentUri,
        initialSelectionRange: {
          start: 0,
          end: uri.path.name.length,
        },
        validate: (name, mode) => {
          if (initialValue === name && mode === 'preview') {
            return false;
          }
          return this.validateFileName(name, parent, false);
        },
      },
      this.labelProvider
    );
    const name = await dialog.open();
    if (!name) {
      return;
    }
    const nameWithExt = this.maybeAppendInoExt(name);
    const oldUri = uri;
    const newUri = uri.parent.resolve(nameWithExt);
    return this.fileService.move(oldUri, newUri);
  }
}

export function invalidExtension(
  extension: string
): string | PromiseLike<string> {
  return nls.localize(
    'theia/workspace/invalidExtension',
    '.{0} is not a valid extension',
    extension.charAt(0) === '.' ? extension.slice(1) : extension
  );
}

interface FileInput {
  /**
   * The raw text the user enters in the `<input>`.
   */
  readonly raw: string;
  /**
   * This is the name without the extension. If raw is `'lib.cpp'`, then `name` will be `'lib'`. If raw is `'foo'` or `'foo.'` this value is `'foo'`.
   */
  readonly name: string;
  /**
   * With the leading dot. For example `'.ino'` or `'.cpp'`.
   */
  readonly extension: string;
}
export function parseFileInput(userInput: string): FileInput {
  if (!userInput) {
    return {
      raw: '',
      name: '',
      extension: Sketch.Extensions.DEFAULT,
    };
  }
  const path = new Path(userInput);
  let extension = path.ext;
  if (extension.trim() === '' || extension.trim() === '.') {
    extension = Sketch.Extensions.DEFAULT;
  }
  return {
    raw: userInput,
    name: path.name,
    extension,
  };
}
