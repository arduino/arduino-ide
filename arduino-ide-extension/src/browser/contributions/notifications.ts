import { injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, Contribution } from './contribution';

@injectable()
export class Notifications extends Contribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Notifications.Commands.NOTIFY, {
      execute: (arg) => {
        if (NotifyParams.is(arg)) {
          switch (arg.type) {
            case 'info':
              return this.messageService.info(arg.message);
            case 'warn':
              return this.messageService.warn(arg.message);
            case 'error':
              return this.messageService.error(arg.message);
          }
        }
      },
    });
  }
}
export namespace Notifications {
  export namespace Commands {
    export const NOTIFY: Command = {
      id: 'arduino-notify',
    };
  }
}
const TypeLiterals = ['info', 'warn', 'error'] as const;
export type Type = typeof TypeLiterals[number];
interface NotifyParams {
  readonly type: Type;
  readonly message: string;
}
namespace NotifyParams {
  export function is(arg: unknown): arg is NotifyParams {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'message' in object &&
        'type' in object &&
        typeof object['message'] === 'string' &&
        typeof object['type'] === 'string' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TypeLiterals.includes(object['type'] as any)
      );
    }
    return false;
  }
}
