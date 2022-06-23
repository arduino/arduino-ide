import { Command, CommandRegistry, MaybePromise } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Contribution } from '../../contributions/contribution';

@injectable()
export class EncodedCommandsContribution extends Contribution {
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  override onReady(): MaybePromise<void> {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('commands');
    if (!encoded) return;

    const commands = JSON.parse(decodeURIComponent(encoded));

    if (Array.isArray(commands)) {
      commands.forEach((c: Command) => {
        this.commandRegistry.executeCommand(c.id);
      });
    }
  }
}
