import { Emitter, Event, ILogger } from '@theia/core';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { CoreError } from '../../common/protocol/core-service';

@injectable()
export class CoreErrorHandler {
  @inject(ILogger)
  @named('compiler-errors')
  private readonly errorsLogger: ILogger;

  private readonly errors: CoreError.ErrorLocation[] = [];
  private readonly compilerErrorsDidChangeEmitter = new Emitter<
    CoreError.ErrorLocation[]
  >();

  tryHandle(error: unknown): void {
    this.errorsLogger.info('Handling compiler errors...');
    if (!CoreError.is(error)) {
      this.errorsLogger.info(
        `Handling compiler errors. Skipped. Unknown errors: ${JSON.stringify(
          error
        )}`
      );
      return;
    }
    this.errors.length = 0;
    this.errors.push(...error.data);
    this.fireCompilerErrorsDidChange();
    this.errorsLogger.info('Handling compiler errors. Done.');
  }

  reset(): void {
    this.errorsLogger.info('Invalidating errors...');
    this.errors.length = 0;
    this.fireCompilerErrorsDidChange();
    this.errorsLogger.info('Invalidating errors. Done.');
  }

  get onCompilerErrorsDidChange(): Event<CoreError.ErrorLocation[]> {
    return this.compilerErrorsDidChangeEmitter.event;
  }

  private fireCompilerErrorsDidChange(): void {
    this.compilerErrorsDidChangeEmitter.fire(this.errors.slice());
  }
}
