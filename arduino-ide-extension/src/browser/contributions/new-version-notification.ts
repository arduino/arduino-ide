import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { UpdatesRetriever } from '../updates/updates-retriever';
import { shell } from 'electron';

const GO_TO_DOWNLOAD_PAGE = 'Go to download page...';
/**
 * Listens on `BoardsConfig.Config` changes, if a board is selected which does not
 * have the corresponding core installed, it proposes the user to install the core.
 */
@injectable()
export class NewVersionNotification implements FrontendApplicationContribution {
    @inject(UpdatesRetriever)
    private readonly updatesRetriever: UpdatesRetriever;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    async onStart(): Promise<void> {
        if (await this.updatesRetriever.isUpdateAvailable()) {
            this.messageService.info('New Arduino IDE version available.', GO_TO_DOWNLOAD_PAGE).then(async answer => {
                if (answer === GO_TO_DOWNLOAD_PAGE) {
                    shell.openExternal('https://www.arduino.cc/en/software#experimental-software');
                }
            })
        }
    }
}
