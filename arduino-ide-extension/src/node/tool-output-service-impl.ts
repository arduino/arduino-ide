import { injectable } from "inversify";
import { ToolOutputServiceServer, ToolOutputServiceClient } from "../common/protocol/tool-output-service";

@injectable()
export class ToolOutputServiceServerImpl implements ToolOutputServiceServer {
    protected clients: ToolOutputServiceClient[] = [];

    publishNewOutput(tool: string, chunk: string): void {
        if (!chunk) {
            return;
        }

        this.clients.forEach(c => c.onNewOutput(tool, chunk));
    }

    setClient(client: ToolOutputServiceClient | undefined): void {
        if (!client) {
            return;
        }

        this.clients.push(client);
    }

    disposeClient(client: ToolOutputServiceClient): void {

    }

    dispose(): void {
        this.clients = [];
    }

}
