import { ToolOutputServiceClient } from "../../common/protocol/tool-output-service";
import { injectable, inject } from "inversify";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { OutputContribution } from "@theia/output/lib/browser/output-contribution";

@injectable()
export class ToolOutputServiceClientImpl implements ToolOutputServiceClient {

    @inject(OutputChannelManager)
    protected readonly outputChannelManager: OutputChannelManager;

    @inject(OutputContribution)
    protected readonly outputContribution: OutputContribution;

    onNewOutput(tool: string, chunk: string): void {
        this.outputContribution.openView({ reveal: true }).then(() => {
            const channel = this.outputChannelManager.getChannel(`Arduino: ${tool}`);
            channel.setVisibility(true);
            channel.append(chunk);
        });
    }

}
