import { inject, injectable } from '@theia/core/shared/inversify';
import { ArduinoMenus } from '../menu/arduino-menus';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  CoreServiceContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';

@injectable()
export class BurnBootloader extends CoreServiceContribution {
  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClientImpl: BoardsServiceProvider;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(BurnBootloader.Commands.BURN_BOOTLOADER, {
      execute: () => this.burnBootloader(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.TOOLS__BOARD_SETTINGS_GROUP, {
      commandId: BurnBootloader.Commands.BURN_BOOTLOADER.id,
      label: nls.localize(
        'arduino/bootloader/burnBootloader',
        'Burn Bootloader'
      ),
      order: 'z99',
    });
  }

  async burnBootloader(): Promise<void> {
    try {
      const { boardsConfig } = this.boardsServiceClientImpl;
      const port = boardsConfig.selectedPort;
      const [fqbn, { selectedProgrammer: programmer }, verify, verbose] =
        await Promise.all([
          this.boardsDataStore.appendConfigToFqbn(
            boardsConfig.selectedBoard?.fqbn
          ),
          this.boardsDataStore.getData(boardsConfig.selectedBoard?.fqbn),
          this.preferences.get('arduino.upload.verify'),
          this.preferences.get('arduino.upload.verbose'),
        ]);

      const board = {
        ...boardsConfig.selectedBoard,
        name: boardsConfig.selectedBoard?.name || '',
        fqbn,
      };
      this.outputChannelManager.getChannel('Arduino').clear();
      await this.coreService.burnBootloader({
        board,
        programmer,
        port,
        verify,
        verbose,
      });
      this.messageService.info(
        nls.localize(
          'arduino/bootloader/doneBurningBootloader',
          'Done burning bootloader.'
        ),
        {
          timeout: 3000,
        }
      );
    } catch (e) {
      this.handleError(e);
    }
  }
}

export namespace BurnBootloader {
  export namespace Commands {
    export const BURN_BOOTLOADER: Command = {
      id: 'arduino-burn-bootloader',
    };
  }
}
