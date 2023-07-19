import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { ConfirmDialog } from '@theia/core/lib/browser/dialogs';
import { ArduinoMenus } from '../menu/arduino-menus';
import { LibraryService, ResponseServiceClient } from '../../common/protocol';
import { ExecuteWithProgress } from '../../common/protocol/progressible';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';

@injectable()
export class AddZipLibrary extends SketchContribution {
  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;

  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(AddZipLibrary.Commands.ADD_ZIP_LIBRARY, {
      execute: () => this.addZipLibrary(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    const includeLibMenuPath = [
      ...ArduinoMenus.SKETCH__UTILS_GROUP,
      '0_include',
    ];
    registry.registerMenuAction([...includeLibMenuPath, '1_install'], {
      commandId: AddZipLibrary.Commands.ADD_ZIP_LIBRARY.id,
      label: nls.localize('arduino/library/addZip', 'Add .ZIP Library...'),
      order: '1',
    });
  }

  private async addZipLibrary(): Promise<void> {
    const homeUri = await this.envVariableServer.getHomeDirUri();
    const defaultPath = await this.fileService.fsPath(new URI(homeUri));
    const { canceled, filePaths } = await this.dialogService.showOpenDialog({
      title: nls.localize(
        'arduino/selectZip',
        "Select a zip file containing the library you'd like to add"
      ),
      defaultPath,
      properties: ['openFile'],
      filters: [
        {
          name: nls.localize('arduino/library/zipLibrary', 'Library'),
          extensions: ['zip'],
        },
      ],
    });
    if (!canceled && filePaths.length) {
      const zipUri = await this.fileSystemExt.getUri(filePaths[0]);
      try {
        await this.doInstall(zipUri);
      } catch (error) {
        if (error instanceof AlreadyInstalledError) {
          const result = await new ConfirmDialog({
            msg: error.message,
            title: nls.localize(
              'arduino/library/overwriteExistingLibrary',
              'Do you want to overwrite the existing library?'
            ),
            ok: nls.localize('vscode/extensionsUtils/yes', 'Yes'),
            cancel: nls.localize('vscode/extensionsUtils/no', 'No'),
          }).open();
          if (result) {
            await this.doInstall(zipUri, true);
          }
        }
      }
    }
  }

  private async doInstall(zipUri: string, overwrite?: boolean): Promise<void> {
    try {
      await ExecuteWithProgress.doWithProgress({
        messageService: this.messageService,
        progressText:
          nls.localize('arduino/common/processing', 'Processing') +
          ` ${new URI(zipUri).path.base}`,
        responseService: this.responseService,
        run: () => this.libraryService.installZip({ zipUri, overwrite }),
      });
      this.messageService.info(
        nls.localize(
          'arduino/library/successfullyInstalledZipLibrary',
          'Successfully installed library from {0} archive',
          new URI(zipUri).path.base
        ),
        { timeout: 3000 }
      );
    } catch (error) {
      if (error instanceof Error) {
        const match = error.message.match(/library (.*?) already installed/);
        if (match && match.length >= 2) {
          const name = match[1].trim();
          if (name) {
            throw new AlreadyInstalledError(
              nls.localize(
                'arduino/library/namedLibraryAlreadyExists',
                'A library folder named {0} already exists. Do you want to overwrite it?',
                name
              ),
              name
            );
          } else {
            throw new AlreadyInstalledError(
              nls.localize(
                'arduino/library/libraryAlreadyExists',
                'A library already exists. Do you want to overwrite it?'
              )
            );
          }
        }
      }
      this.messageService.error(error.toString());
      throw error;
    }
  }
}

class AlreadyInstalledError extends Error {
  constructor(message: string, readonly libraryName?: string) {
    super(message);
    Object.setPrototypeOf(this, AlreadyInstalledError.prototype);
  }
}

export namespace AddZipLibrary {
  export namespace Commands {
    export const ADD_ZIP_LIBRARY: Command = {
      id: 'arduino-add-zip-library',
    };
  }
}
