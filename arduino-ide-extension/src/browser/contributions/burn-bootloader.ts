import { nls } from '@theia/core/lib/common';
import { injectable } from '@theia/core/shared/inversify';
import { CoreService } from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  Command,
  CommandRegistry,
  CoreServiceContribution,
  MenuModelRegistry,
} from './contribution';

@injectable()
export class BurnBootloader extends CoreServiceContribution {
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

  private async burnBootloader(): Promise<void> {
    const options = await this.options();
    try {
      await this.doWithProgress({
        progressText: nls.localize(
          'arduino/bootloader/burningBootloader',
          'Burning bootloader...'
        ),
        task: (progressId, coreService) =>
          coreService.burnBootloader({
            ...options,
            progressId,
          }),
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

  private async options(): Promise<CoreService.Options.Bootloader> {
    const { boardsConfig } = this.boardsServiceProvider;
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
    return {
      fqbn,
      programmer,
      port,
      verify,
      verbose,
    };
  }
}

export namespace BurnBootloader {
  export namespace Commands {
    export const BURN_BOOTLOADER: Command = {
      id: 'arduino-burn-bootloader',
    };
  }
}
