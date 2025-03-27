import { open } from '@theia/core/lib/browser/opener-service';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import {
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { nls } from '@theia/core/lib/common/nls';
import { Path } from '@theia/core/lib/common/path';
import { waitForEvent } from '@theia/core/lib/common/promise-util';
import { SelectionService } from '@theia/core/lib/common/selection-service';
import { MaybeArray } from '@theia/core/lib/common/types';
import URI from '@theia/core/lib/common/uri';
import {
  UriAwareCommandHandler,
  UriCommandHandler,
} from '@theia/core/lib/common/uri-command-handler';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { FileStat } from '@theia/filesystem/lib/common/files';
import {
  WorkspaceCommandContribution as TheiaWorkspaceCommandContribution,
  WorkspaceCommands,
} from '@theia/workspace/lib/browser/workspace-commands';
import { Sketch } from '../../../common/protocol';
import { ConfigServiceClient } from '../../config/config-service-client';
import { CreateFeatures } from '../../create/create-features';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { WorkspaceInputDialog } from './workspace-input-dialog';

interface ValidationContext {
  sketch: Sketch;
  isCloud: boolean | undefined;
}

@injectable()
export class WorkspaceCommandContribution extends TheiaWorkspaceCommandContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;
  @inject(CreateFeatures)
  private readonly createFeatures: CreateFeatures;
  @inject(ApplicationShell)
  private readonly shell: ApplicationShell;
  @inject(ConfigServiceClient)
  private readonly configServiceClient: ConfigServiceClient;
  private _validationContext: ValidationContext | undefined;

  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.unregisterCommand(WorkspaceCommands.NEW_FILE);
    registry.registerCommand(
      WorkspaceCommands.NEW_FILE,
      this.newWorkspaceRootUriAwareCommandHandler({
        execute: (uri) => this.newFile(uri),
      })
    );
    registry.unregisterCommand(WorkspaceCommands.NEW_FOLDER);
    registry.registerCommand(
      WorkspaceCommands.NEW_FOLDER,
      this.newWorkspaceRootUriAwareCommandHandler({
        execute: (uri) => this.newFolder(uri),
      })
    );
    registry.unregisterCommand(WorkspaceCommands.FILE_RENAME);
    registry.registerCommand(
      WorkspaceCommands.FILE_RENAME,
      this.newUriAwareCommandHandler({
        execute: (uri) => this.renameFile(uri),
      })
    );
    registry.unregisterCommand(WorkspaceCommands.FILE_DELETE);
    registry.registerCommand(
      WorkspaceCommands.FILE_DELETE,
      this.newMultiUriAwareCommandHandler(this.deleteHandler)
    );
  }

  private async newFolder(uri: URI | undefined): Promise<void> {
    if (!uri) {
      return;
    }

    const parent = await this.getDirectory(uri);
    if (!parent) {
      return;
    }

    const dialog = new WorkspaceInputDialog(
      {
        title: nls.localizeByDefault('New Folder...'),
        parentUri: uri,
        placeholder: nls.localize(
          'theia/workspace/newFolderPlaceholder',
          'Folder Name'
        ),
        validate: (name) => this.validateFileName(name, parent, true),
      },
      this.labelProvider
    );
    const name = await this.openDialog(dialog, uri);
    if (!name) {
      return;
    }
    const folderUri = uri.resolve(name);
    await this.fileService.createFolder(folderUri);
    this.fireCreateNewFile({ parent: uri, uri: folderUri });
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

    const name = await this.openDialog(dialog, parentUri);
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
      errorMessage = this._validationContext?.isCloud
        ? Sketch.validateCloudSketchFolderName(name)
        : Sketch.validateSketchFolderName(name);
    }
    if (errorMessage) {
      return this.maybeRemapAlreadyExistsMessage(errorMessage, userInput);
    }
    errorMessage = await super.validateFileName(userInput, parent, recursive); // run the default Theia validation with the raw input.
    if (errorMessage) {
      return this.maybeRemapAlreadyExistsMessage(errorMessage, userInput);
    }
    // It's a legacy behavior from IDE 1.x. Validate the file as if it were an `.ino` file.
    // If user did not write the `.ino` extension or ended the user input with dot, run the default Theia validation with the inferred name.
    if (extension === '.ino' && !userInput.endsWith('.ino')) {
      userInput = `${name}${extension}`;
      errorMessage = await super.validateFileName(userInput, parent, recursive);
    }
    return this.maybeRemapAlreadyExistsMessage(errorMessage ?? '', userInput);
  }

  // Remaps the Theia-based `A file or folder **$fileName** already exists at this location. Please choose a different name.` to a custom one.
  private maybeRemapAlreadyExistsMessage(
    errorMessage: string,
    userInput: string
  ): string {
    if (
      errorMessage ===
      nls.localizeByDefault(
        'A file or folder **{0}** already exists at this location. Please choose a different name.',
        this['trimFileName'](userInput)
      )
    ) {
      return fileAlreadyExists(userInput);
    }
    return errorMessage;
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
    if (!Sketch.isInSketch(uri, sketch)) {
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
    const name = await this.openDialog(dialog, uri);
    if (!name) {
      return;
    }
    const nameWithExt = this.maybeAppendInoExt(name);
    const oldUri = uri;
    const newUri = uri.parent.resolve(nameWithExt);
    return this.fileService.move(oldUri, newUri);
  }

  protected override newUriAwareCommandHandler(
    handler: UriCommandHandler<URI>
  ): UriAwareCommandHandler<URI> {
    return this.createUriAwareCommandHandler(handler);
  }

  protected override newMultiUriAwareCommandHandler(
    handler: UriCommandHandler<URI[]>
  ): UriAwareCommandHandler<URI[]> {
    return this.createUriAwareCommandHandler(handler, true);
  }

  private createUriAwareCommandHandler<T extends MaybeArray<URI>>(
    delegate: UriCommandHandler<T>,
    multi = false
  ): UriAwareCommandHandler<T> {
    return new UriAwareCommandHandlerWithCurrentEditorFallback(
      delegate,
      this.selectionService,
      this.shell,
      this.sketchesServiceClient,
      this.configServiceClient,
      this.createFeatures,
      { multi }
    );
  }

  private async openDialog(
    dialog: WorkspaceInputDialog,
    uri: URI
  ): Promise<string | undefined> {
    try {
      let dataDirUri = this.configServiceClient.tryGetDataDirUri();
      if (!dataDirUri) {
        dataDirUri = await waitForEvent(
          this.configServiceClient.onDidChangeDataDirUri,
          2_000
        );
      }
      this.acquireValidationContext(uri, dataDirUri);
      const name = await dialog.open(true);
      return name;
    } finally {
      this._validationContext = undefined;
    }
  }

  private acquireValidationContext(
    uri: URI,
    dataDirUri: URI | undefined
  ): void {
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (
      CurrentSketch.isValid(sketch) &&
      new URI(sketch.uri).isEqualOrParent(uri)
    ) {
      const isCloud = this.createFeatures.isCloud(sketch, dataDirUri);
      this._validationContext = { sketch, isCloud };
    }
  }
}

// (non-API) exported for tests
export function fileAlreadyExists(userInput: string): string {
  return nls.localize(
    'arduino/workspace/alreadyExists',
    "'{0}' already exists.",
    userInput
  );
}

// (non-API) exported for tests
export function invalidExtension(extension: string): string {
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

/**
 * By default, the Theia-based URI-aware command handler tries to retrieve the URI from the selection service.
 * Delete/Rename from the tab-bar toolbar (`...`) is not active if the selection was never inside an editor.
 * This implementation falls back to the current current title of the main panel if no URI can be retrieved from the parent classes.
 *  - https://github.com/arduino/arduino-ide/issues/1847
 *  - https://github.com/eclipse-theia/theia/issues/12139
 */
class UriAwareCommandHandlerWithCurrentEditorFallback<
  T extends MaybeArray<URI>
> extends UriAwareCommandHandler<T> {
  constructor(
    delegate: UriCommandHandler<T>,
    selectionService: SelectionService,
    private readonly shell: ApplicationShell,
    private readonly sketchesServiceClient: SketchesServiceClientImpl,
    private readonly configServiceClient: ConfigServiceClient,
    private readonly createFeatures: CreateFeatures,
    options?: UriAwareCommandHandler.Options
  ) {
    super(selectionService, delegate, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected override getUri(...args: any[]): T | undefined {
    const uri = super.getUri(...args);
    if (!uri || (Array.isArray(uri) && !uri.length)) {
      const fallbackUri = this.currentTitleOwnerUriFromMainPanel;
      if (fallbackUri) {
        return (this.isMulti() ? [fallbackUri] : fallbackUri) as T;
      }
    }
    return uri;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override isEnabled(...args: any[]): boolean {
    const [uri, ...others] = this.getArgsWithUri(...args);
    if (uri) {
      if (!this.isInSketch(uri)) {
        return false;
      }
      if (this.affectsCloudSketchFolderWhenSignedOut(uri)) {
        return false;
      }
      if (this.handler.isEnabled) {
        return this.handler.isEnabled(uri, ...others);
      }
      return true;
    }
    return false;
  }

  // The `currentEditor` is broken after a rename. (https://github.com/eclipse-theia/theia/issues/12139)
  // `ApplicationShell#currentWidget` might provide a wrong result just as the `getFocusedCodeEditor` and `getFocusedCodeEditor` of the `MonacoEditorService`
  // Try to extract the URI from the current title of the main panel if it's an editor widget.
  private get currentTitleOwnerUriFromMainPanel(): URI | undefined {
    const owner = this.shell.mainPanel.currentTitle?.owner;
    return owner instanceof EditorWidget
      ? owner.editor.getResourceUri()
      : undefined;
  }

  private isInSketch(uri: T | undefined): boolean {
    if (!uri) {
      return false;
    }
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }
    if (this.isMulti() && Array.isArray(uri)) {
      return uri.every((u) => Sketch.isInSketch(u, sketch));
    }
    if (!this.isMulti() && uri instanceof URI) {
      return Sketch.isInSketch(uri, sketch);
    }
    return false;
  }

  /**
   * If the user is not logged in, deleting/renaming the main sketch file or the sketch folder of a cloud sketch is disabled.
   */
  private affectsCloudSketchFolderWhenSignedOut(uri: T | undefined): boolean {
    return (
      !Boolean(this.createFeatures.session) &&
      Boolean(this.isCurrentSketchCloud()) &&
      this.affectsSketchFolder(uri)
    );
  }

  private affectsSketchFolder(uri: T | undefined): boolean {
    if (!uri) {
      return false;
    }
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }
    if (this.isMulti() && Array.isArray(uri)) {
      return uri.map((u) => u.toString()).includes(sketch.mainFileUri);
    }
    if (!this.isMulti()) {
      return sketch.mainFileUri === uri.toString();
    }
    return false;
  }

  private isCurrentSketchCloud(): boolean | undefined {
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return false;
    }
    const dataDirUri = this.configServiceClient.tryGetDataDirUri();
    return this.createFeatures.isCloud(sketch, dataDirUri);
  }
}
