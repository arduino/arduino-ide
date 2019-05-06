import { ToolOutputServiceClient } from "../../common/protocol/tool-output-service";
import { injectable, inject } from "inversify";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";

@injectable()
export class ToolOutputServiceClientImpl implements ToolOutputServiceClient {

    @inject(OutputChannelManager)
    protected readonly outputChannelManager: OutputChannelManager;

    onNewOutput(tool: string, chunk: string): void {
        const channel = this.outputChannelManager.getChannel(`Arduino: ${tool}`);
        channel.append(chunk);
    }

}