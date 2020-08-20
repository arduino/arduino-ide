import { JsonRpcServer } from '@theia/core';

export interface ToolOutputMessage {
    readonly tool: string;
    readonly chunk: string;
    readonly severity?: 'error' | 'warning' | 'info';
}

export const ToolOutputServiceServer = Symbol('ToolOutputServiceServer');
export interface ToolOutputServiceServer extends JsonRpcServer<ToolOutputServiceClient> {
    append(message: ToolOutputMessage): void;
    disposeClient(client: ToolOutputServiceClient): void;
}

export const ToolOutputServiceClient = Symbol('ToolOutputServiceClient');
export interface ToolOutputServiceClient {
    onMessageReceived(message: ToolOutputMessage): void;
}

export namespace ToolOutputService {
    export const SERVICE_PATH = '/tool-output-service';
}
