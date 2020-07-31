import { injectable, inject } from 'inversify';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { OutputChannelManager, OutputChannelSeverity } from '@theia/output/lib/common/output-channel';
import { ToolOutputServiceClient, ToolOutputMessage } from '../../common/protocol/tool-output-service';

@injectable()
export class ToolOutputServiceClientImpl implements ToolOutputServiceClient {

    @inject(OutputContribution)
    protected outputContribution: OutputContribution;

    @inject(OutputChannelManager)
    protected outputChannelManager: OutputChannelManager;

    onMessageReceived(message: ToolOutputMessage): void {
        const { tool, chunk } = message;
        const name = `Arduino: ${tool}`;
        const channel = this.outputChannelManager.getChannel(name);
        // Zen-mode: we do not reveal the output for daemon messages.
        const show: Promise<any> = tool === 'daemon'
            // This will open and reveal the view but won't show it. You will see the toggle bottom panel on the status bar
            ? this.outputContribution.openView({ activate: false, reveal: false })
            // This will open, reveal but do not activate the Output view.
            : Promise.resolve(channel.show({ preserveFocus: true }));

        show.then(() => channel.append(chunk, this.toOutputSeverity(message)));
    }

    private toOutputSeverity(message: ToolOutputMessage): OutputChannelSeverity {
        if (message.severity) {
            switch (message.severity) {
                case 'error': return OutputChannelSeverity.Error
                case 'warning': return OutputChannelSeverity.Warning
                case 'info': return OutputChannelSeverity.Info
                default: return OutputChannelSeverity.Info
            }
        }
        return OutputChannelSeverity.Info
    }

}
