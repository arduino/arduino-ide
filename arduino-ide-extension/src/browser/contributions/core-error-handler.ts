import { Emitter, Event } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CoreError } from '../../common/protocol/core-service';

@injectable()
export class CoreErrorHandler {
  private readonly compilerErrors: CoreError.Compiler[] = [];
  private readonly compilerErrorsDidChangeEmitter = new Emitter<
    CoreError.Compiler[]
  >();

  tryHandle(error: unknown): void {
    if (CoreError.is(error)) {
      this.compilerErrors.length = 0;
      this.compilerErrors.push(...error.data.filter(CoreError.Compiler.is));
      this.fireCompilerErrorsDidChange();
    }
  }

  reset(): void {
    this.compilerErrors.length = 0;
    this.fireCompilerErrorsDidChange();
  }

  get onCompilerErrorsDidChange(): Event<CoreError.Compiler[]> {
    return this.compilerErrorsDidChangeEmitter.event;
  }

  private fireCompilerErrorsDidChange(): void {
    this.compilerErrorsDidChangeEmitter.fire(this.compilerErrors.slice());
  }
}
