export interface OutputMessage {
    readonly chunk: string;
    readonly severity?: 'error' | 'warning' | 'info'; // Currently not used!
}

export const OutputServicePath = '/services/output-service';
export const OutputService = Symbol('OutputService');
export interface OutputService {
    append(message: OutputMessage): void;
}
