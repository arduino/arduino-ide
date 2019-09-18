import { injectable, inject, postConstruct } from 'inversify';
import { BaseLanguageClientContribution, NotificationType } from '@theia/languages/lib/browser';
import { BoardsServiceClientImpl } from '../boards/boards-service-client-impl';
import { BoardsConfig } from '../boards/boards-config';

const SELECTED_BOARD = new NotificationType<BoardsConfig.Config, void>('arduino/selectedBoard');

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

    private cancelationToken?: CancelationToken;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @postConstruct()
    protected init() {
        this.boardsServiceClient.onBoardsConfigChanged(this.selectBoard.bind(this));
    }

    async selectBoard(config: BoardsConfig.Config): Promise<void> {
        // The board configuration may change multiple times before the language client is activated.
        const token: CancelationToken = {};
        this.cancelationToken = token;
        const lc = await this.languageClient;
        if (this.cancelationToken === token) {
            lc.sendNotification(SELECTED_BOARD, config);
            this.cancelationToken = undefined;
        }
    }

}

type CancelationToken = {}
