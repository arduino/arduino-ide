import type { Event } from '@theia/core/lib/common/event';

export interface OutputMessage {
  readonly chunk: string;
  readonly severity?: OutputMessage.Severity;
}
export namespace OutputMessage {
  export enum Severity {
    Error,
    Warning,
    Info,
  }
}

export interface ProgressMessage {
  readonly progressId: string;
  readonly message: string;
  readonly work?: ProgressMessage.Work;
}
export namespace ProgressMessage {
  export function is(arg: unknown): arg is ProgressMessage {
    if (typeof arg === 'object') {
      const object = arg as Record<string, unknown>;
      return (
        'progressId' in object &&
        typeof object.progressId === 'string' &&
        'message' in object &&
        typeof object.message === 'string'
      );
    }
    return false;
  }
  export interface Work {
    readonly done: number;
    readonly total: number;
  }
}

export const ResponseServicePath = '/services/response-service';
export const ResponseService = Symbol('ResponseService');
export interface ResponseService {
  appendToOutput(message: OutputMessage): void;
  reportProgress(message: ProgressMessage): void;
}

export const ResponseServiceClient = Symbol('ResponseServiceClient');
export interface ResponseServiceClient extends ResponseService {
  onProgressDidChange: Event<ProgressMessage>;
  clearOutput: () => void;
}
