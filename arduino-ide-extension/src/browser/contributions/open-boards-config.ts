import { CommandRegistry } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardsConfigDialog } from '../boards/boards-config-dialog';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { Contribution, Command } from './contribution';

@injectable()
export class OpenBoardsConfig extends Contribution {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(BoardsConfigDialog)
  private readonly boardsConfigDialog: BoardsConfigDialog;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenBoardsConfig.Commands.OPEN_DIALOG, {
      execute: async (query?: string | undefined) => {
        const boardsConfig = await this.boardsConfigDialog.open(query);
        if (boardsConfig) {
          this.boardsServiceProvider.boardsConfig = boardsConfig;
        }
      },
    });
  }
}
export namespace OpenBoardsConfig {
  export namespace Commands {
    export const OPEN_DIALOG: Command = {
      id: 'arduino-open-boards-dialog',
    };
  }
}
