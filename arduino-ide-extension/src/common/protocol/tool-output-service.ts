import { JsonRpcServer } from "@theia/core";

export const ToolOutputServiceServer = Symbol("ToolOutputServiceServer");
export interface ToolOutputServiceServer extends JsonRpcServer<ToolOutputServiceClient> {
    publishNewOutput(tool: string, chunk: string): void;
    disposeClient(client: ToolOutputServiceClient): void;
}

export const ToolOutputServiceClient = Symbol("ToolOutputServiceClient");
export interface ToolOutputServiceClient {
    onNewOutput(tool: string, chunk: string): void;
}

export namespace ToolOutputService {
    export const SERVICE_PATH = "/tool-output-service";
}
