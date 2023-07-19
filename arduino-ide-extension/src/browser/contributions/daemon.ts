import { nls } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ArduinoDaemon } from '../../common/protocol';
import { Contribution, Command, CommandRegistry } from './contribution';

@injectable()
export class Daemon extends Contribution {
  @inject(ArduinoDaemon)
  private readonly daemon: ArduinoDaemon;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Daemon.Commands.START_DAEMON, {
      execute: () => this.daemon.start(),
    });
    registry.registerCommand(Daemon.Commands.STOP_DAEMON, {
      execute: () => this.daemon.stop(),
    });
    registry.registerCommand(Daemon.Commands.RESTART_DAEMON, {
      execute: () => this.daemon.restart(),
    });
  }
}
export namespace Daemon {
  export namespace Commands {
    export const START_DAEMON: Command = {
      id: 'arduino-start-daemon',
      label: nls.localize('arduino/daemon/start', 'Start Daemon'),
      category: 'Arduino',
    };
    export const STOP_DAEMON: Command = {
      id: 'arduino-stop-daemon',
      label: nls.localize('arduino/daemon/stop', 'Stop Daemon'),
      category: 'Arduino',
    };
    export const RESTART_DAEMON: Command = {
      id: 'arduino-restart-daemon',
      label: nls.localize('arduino/daemon/restart', 'Restart Daemon'),
      category: 'Arduino',
    };
  }
}
