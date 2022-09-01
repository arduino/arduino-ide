import type { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { inject, injectable } from '@theia/core/shared/inversify';
import type { EditBoardsConfigActionParams } from '../../common/protocol/board-list';
import { BoardsConfigDialog } from '../boards/boards-config-dialog';
import { Contribution } from './contribution';

@injectable()
export class OpenBoardsConfig extends Contribution {
  @inject(BoardsConfigDialog)
  private readonly boardsConfigDialog: BoardsConfigDialog;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(OpenBoardsConfig.Commands.OPEN_DIALOG, {
      execute: async (params?: EditBoardsConfigActionParams) =>
        this.boardsConfigDialog.open(params),
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
