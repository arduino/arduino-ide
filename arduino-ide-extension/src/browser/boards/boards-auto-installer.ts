import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { BoardsService, Board } from '../../common/protocol/boards-service';
import { BoardsServiceClientImpl } from './boards-service-client-impl';
import { BoardsListWidgetFrontendContribution } from './boards-widget-frontend-contribution';
import { InstallationProgressDialog } from '../components/progress-dialog';
import { BoardsConfig } from './boards-config';


/**
 * Listens on `BoardsConfig.Config` changes, if a board is selected which does not
 * have the corresponding core installed, it proposes the user to install the core.
 */
@injectable()
export class BoardsAutoInstaller implements FrontendApplicationContribution {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(BoardsListWidgetFrontendContribution)
    protected readonly boardsManagerFrontendContribution: BoardsListWidgetFrontendContribution;

    onStart(): void {
        this.boardsServiceClient.onBoardsConfigChanged(this.ensureCoreExists.bind(this));
        this.ensureCoreExists(this.boardsServiceClient.boardsConfig);
    }

    protected ensureCoreExists(config: BoardsConfig.Config): void {
        const { selectedBoard } = config;
        if (selectedBoard) {
            this.boardsService.search({}).then(packages => {
                const candidates = packages
                    .filter(pkg => pkg.boards.some(board => Board.sameAs(board, selectedBoard)))
                    .filter(({ installable, installedVersion }) => installable && !installedVersion);
                for (const candidate of candidates) {
                    // tslint:disable-next-line:max-line-length
                    this.messageService.info(`The \`"${candidate.name}"\` core has to be installed for the currently selected \`"${selectedBoard.name}"\` board. Do you want to install it now?`, 'Install Manually', 'Yes').then(async answer => {
                        if (answer === 'Yes') {
                            const dialog = new InstallationProgressDialog(candidate.name, candidate.availableVersions[0]);
                            dialog.open();
                            try {
                                await this.boardsService.install({ item: candidate });
                            } finally {
                                dialog.close();
                            }
                        }
                        if (answer) {
                            this.boardsManagerFrontendContribution.openView({ reveal: true }).then(widget => widget.refresh(candidate.name.toLocaleLowerCase()));
                        }
                    });
                }
            })
        }
    }

}
