
import { VariableContribution, VariableRegistry, Variable } from '@theia/variable-resolver/lib/browser';
import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { BoardsServiceProvider } from 'arduino-ide-extension/lib/browser/boards/boards-service-provider';

@injectable()
export class ArduinoVariableResolver implements VariableContribution {

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider;

    @inject(MessageService)
    protected readonly messageService: MessageService

    registerVariables(variables: VariableRegistry): void {
        variables.registerVariable(<Variable>{
            name: 'fqbn',
            description: 'Qualified name of the selected board',
            resolve: this.resolveFqbn.bind(this),
        });
        variables.registerVariable({
            name: 'port',
            description: 'Selected upload port',
            resolve: this.resolvePort.bind(this)
        });
    }

    protected async resolveFqbn(): Promise<string | undefined> {
        const { boardsConfig } = this.boardsServiceProvider;
        if (!boardsConfig || !boardsConfig.selectedBoard) {
            this.messageService.error('No board selected. Please select a board for debugging.');
            return undefined;
        }
        return boardsConfig.selectedBoard.fqbn;
    }

    protected async resolvePort(): Promise<string | undefined> {
        const { boardsConfig } = this.boardsServiceProvider;
        if (!boardsConfig || !boardsConfig.selectedPort) {
            return undefined;
        }
        return boardsConfig.selectedPort.address;
    }

}
