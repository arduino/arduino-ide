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
        const index = this.clients.indexOf(client);
        if (index === -1) {
            console.warn(`Could not dispose tools output client. It was not registered.`);
            return;
        }
        this.clients.splice(index, 1);
    }

    dispose(): void {
        this.clients = [];
    }

}
