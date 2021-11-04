import { inject, injectable } from 'inversify';
import { OutputChannelManager } from '@theia/output/lib/common/output-channel';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { BoardsDataStore } from '../boards/boards-data-store';
import { SerialConnectionManager } from '../monitor/monitor-connection';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
} from './contribution';
import { nls } from '@theia/core/lib/browser/nls';

@injectable()
export class BurnBootloader extends SketchContribution {
  @inject(CoreService)
  protected readonly coreService: CoreService;

  @inject(SerialConnectionManager)
  protected readonly monitorConnection: SerialConnectionManager;

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
    await this.monitorConnection.disconnect();
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
      this.outputChannelManager.getChannel('Arduino').clear();
      await this.coreService.burnBootloader({
        fqbn,
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
      this.messageService.error(e.toString());
    } finally {
      if (this.monitorConnection.isSerialOpen()) {
        await this.monitorConnection.connect();
      }
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
