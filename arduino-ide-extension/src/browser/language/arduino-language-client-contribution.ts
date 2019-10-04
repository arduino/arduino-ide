import { injectable, inject, postConstruct } from 'inversify';
import { BaseLanguageClientContribution } from '@theia/languages/lib/browser';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { BoardsConfig } from '../boards/boards-config';

@injectable()
export class ArduinoLanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = 'ino';
    readonly name = 'Arduino';

    protected get documentSelector(): string[] {
        return ['ino'];
    }

    protected get globPatterns() {
        return ['**/*.ino'];
    }

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    protected boardConfig?: BoardsConfig.Config;

    @postConstruct()
    protected init() {
        this.boardsServiceClient.onBoardsConfigChanged(this.selectBoard.bind(this));
    }

    selectBoard(config: BoardsConfig.Config): void {
        this.boardConfig = config;
        // Force a restart to send the new board config to the language server
        this.restart();
    }

    protected getStartParameters(): BoardsConfig.Config | undefined {
        return this.boardConfig;
    }

}
