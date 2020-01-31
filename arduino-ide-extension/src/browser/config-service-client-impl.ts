import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { CommandService } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ConfigServiceClient, Config } from '../common/protocol';
import { ArduinoCommands } from './arduino-commands';

@injectable()
export class ConfigServiceClientImpl implements ConfigServiceClient {

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    protected readonly onConfigChangedEmitter = new Emitter<Config>();
    protected invalidConfigPopup: Promise<void | 'No' | 'Yes' | undefined> | undefined;

    notifyConfigChanged(config: Config): void {
        this.invalidConfigPopup = undefined;
        this.info(`The CLI configuration has been successfully reloaded.`);
        this.onConfigChangedEmitter.fire(config);
    }

    notifyInvalidConfig(): void {
        if (!this.invalidConfigPopup) {
            this.invalidConfigPopup = this.messageService.error(`Your CLI configuration is invalid. Do you want to correct it now?`, 'No', 'Yes')
                .then(answer => {
                    if (answer === 'Yes') {
                        this.commandService.executeCommand(ArduinoCommands.OPEN_CLI_CONFIG.id)
                    }
                    this.invalidConfigPopup = undefined;
                })

        }
    }

    get onConfigChanged(): Event<Config> {
        return this.onConfigChangedEmitter.event;
    }

    protected info(message: string): void {
        this.messageService.info(message, { timeout: 3000 });
        this.logger.info(message);
    }

}
