export interface OutputMessage {
    readonly name: string;
    readonly chunk: string;
    readonly severity?: 'error' | 'warning' | 'info';
}

export const OutputServicePath = '/services/output-service';
export const OutputService = Symbol('OutputService');
export interface OutputService {
    append(message: OutputMessage): void;
}
