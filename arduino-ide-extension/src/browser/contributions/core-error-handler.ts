import { Emitter, Event } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CoreError } from '../../common/protocol/core-service';

@injectable()
export class CoreErrorHandler {
  private readonly errors: CoreError.ErrorLocation[] = [];
  private readonly compilerErrorsDidChangeEmitter = new Emitter<
    CoreError.ErrorLocation[]
  >();

  tryHandle(error: unknown): void {
    if (CoreError.is(error)) {
      this.errors.length = 0;
      this.errors.push(...error.data);
      this.fireCompilerErrorsDidChange();
    }
  }

  reset(): void {
    this.errors.length = 0;
    this.fireCompilerErrorsDidChange();
  }

  get onCompilerErrorsDidChange(): Event<CoreError.ErrorLocation[]> {
    return this.compilerErrorsDidChangeEmitter.event;
  }

  private fireCompilerErrorsDidChange(): void {
    this.compilerErrorsDidChangeEmitter.fire(this.errors.slice());
  }
}
