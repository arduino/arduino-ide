import { inject, injectable } from 'inversify';
import { OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { BoardsDataStore } from '../boards/boards-data-store';
import { SerialConnectionManager } from '../serial/serial-connection-manager';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/common';

@injectable()
export class BurnBootloader extends SketchContribution {
  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(SerialConnectionManager)
  protected readonly serialConnection: SerialConnectionManager;

  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceClientImpl: BoardsServiceProvider;

  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(BurnBootloader.Commands.BURN_BOOTLOADER, {
      execute: () => this.burnBootloader(),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
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
      }
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
      let errorMessage = "";
      if (typeof e === "string") {
        errorMessage = e;
      } else {
        errorMessage = e.toString();
      }
      this.messageService.error(errorMessage);
    } finally {
      await this.serialConnection.reconnectAfterUpload();
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
