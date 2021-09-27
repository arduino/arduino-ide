import { Event } from '@theia/core/lib/common/event';

export interface OutputMessage {
  readonly chunk: string;
  readonly severity?: 'error' | 'warning' | 'info'; // Currently not used!
}

export interface ProgressMessage {
  readonly progressId: string;
  readonly message: string;
  readonly work?: ProgressMessage.Work;
}
export namespace ProgressMessage {
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

export const ResponseServiceArduino = Symbol('ResponseServiceArduino');
export interface ResponseServiceArduino extends ResponseService {
  onProgressDidChange: Event<ProgressMessage>;
  clearArduinoChannel: () => void;
}
