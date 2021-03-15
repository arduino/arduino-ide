import { inject, injectable } from 'inversify';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { OutputChannelManager } from '@theia/output/lib/common/output-channel';
import { OutputService, OutputMessage } from '../common/protocol/output-service';

@injectable()
export class OutputServiceImpl implements OutputService {

    @inject(OutputContribution)
    protected outputContribution: OutputContribution;

    @inject(OutputChannelManager)
    protected outputChannelManager: OutputChannelManager;

    append(message: OutputMessage): void {
        const { chunk } = message;
        const channel = this.outputChannelManager.getChannel('Arduino');
        channel.show({ preserveFocus: true });
        channel.append(chunk);
    }

}
