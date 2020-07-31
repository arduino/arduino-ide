import { ToolOutputServiceClient } from '../../common/protocol/tool-output-service';
import { injectable, inject } from 'inversify';
import { CommandService } from '@theia/core/lib/common/command';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';

@injectable()
export class ToolOutputServiceClientImpl implements ToolOutputServiceClient {

    @inject(CommandService)
    protected commandService: CommandService;

    onNewOutput(tool: string, text: string): void {
        const name = `Arduino: ${tool}`;
        // Zen-mode: we do not reveal the output for daemon messages.
        const show = tool === 'daemon22' ? Promise.resolve() : this.commandService.executeCommand(OutputCommands.SHOW.id, { name, options: { preserveFocus: false } });
        show.then(() => this.commandService.executeCommand(OutputCommands.APPEND.id, { name, text }));
    }

}
