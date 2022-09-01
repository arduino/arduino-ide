import {
  CommandContribution,
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { ILogger, Loggable } from '@theia/core/lib/common/logger';
import { LogLevel } from '@theia/core/lib/common/logger-protocol';
import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import { injectable, interfaces } from '@theia/core/shared/inversify';

export function bindCommon(bind: interfaces.Bind): interfaces.Bind {
  bind(ConsoleLogger).toSelf().inSingletonScope();
  bind(ILogger).toService(ConsoleLogger);
  bind(CommandRegistry).toSelf().inSingletonScope();
  bind(CommandService).toService(CommandRegistry);
  bindContributionProvider(bind, CommandContribution);
  return bind;
}

@injectable()
export class ConsoleLogger extends MockLogger {
  override log(
    logLevel: number,
    arg2: string | Loggable | Error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (arg2 instanceof Error) {
      return this.error(String(arg2), params);
    }
    switch (logLevel) {
      case LogLevel.INFO:
        return this.info(arg2, params);
      case LogLevel.WARN:
        return this.warn(arg2, params);
      case LogLevel.TRACE:
        return this.trace(arg2, params);
      case LogLevel.ERROR:
        return this.error(arg2, params);
      case LogLevel.FATAL:
        return this.fatal(arg2, params);
      default:
        return this.info(arg2, params);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async info(arg: string | Loggable, ...params: any[]): Promise<void> {
    if (params.length) {
      console.info(arg, ...params);
    } else {
      console.info(arg);
    }
  }

  override async trace(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (params.length) {
      console.trace(arg, ...params);
    } else {
      console.trace(arg);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async warn(arg: string | Loggable, ...params: any[]): Promise<void> {
    if (params.length) {
      console.warn(arg, ...params);
    } else {
      console.warn(arg);
    }
  }

  override async error(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    if (params.length) {
      console.error(arg, ...params);
    } else {
      console.error(arg);
    }
  }

  override async fatal(
    arg: string | Loggable,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...params: any[]
  ): Promise<void> {
    return this.error(arg, params);
  }
}
