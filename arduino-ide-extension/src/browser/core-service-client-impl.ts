import { injectable, inject } from 'inversify';
import { Emitter, Event } from '@theia/core/lib/common/event';
import { ILogger } from '@theia/core/lib/common/logger';
import { MessageService } from '@theia/core/lib/common/message-service';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { CoreServiceClient } from '../common/protocol';

@injectable()
export class CoreServiceClientImpl implements CoreServiceClient {

    @inject(ILogger)
    protected logger: ILogger;

    @inject(MessageService)
    protected messageService: MessageService;

    @inject(LocalStorageService)
    protected storageService: LocalStorageService;

    protected readonly onIndexUpdatedEmitter = new Emitter<void>();

    notifyIndexUpdated(): void {
        this.info('Index has been updated.');
        this.onIndexUpdatedEmitter.fire();
    }

    get onIndexUpdated(): Event<void> {
        return this.onIndexUpdatedEmitter.event;
    }

    protected info(message: string): void {
        this.messageService.info(message, { timeout: 3000 });
        this.logger.info(message);
    }

}
