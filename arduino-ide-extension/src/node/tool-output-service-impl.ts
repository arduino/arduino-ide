import { injectable } from 'inversify';
import { ToolOutputServiceServer, ToolOutputServiceClient, ToolOutputMessage } from '../common/protocol/tool-output-service';

@injectable()
export class ToolOutputServiceServerImpl implements ToolOutputServiceServer {
    protected clients: ToolOutputServiceClient[] = [];

    append(message: ToolOutputMessage): void {
        if (!message.chunk) {
            return;
        }
        for (const client of this.clients) {
            client.onMessageReceived(message);
        }
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
        for (const client of this.clients) {
            this.disposeClient(client);
        }
        this.clients.length = 0;
    }

}
