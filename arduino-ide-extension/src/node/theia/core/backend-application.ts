import { inject, injectable, named } from 'inversify';
import { ContributionProvider } from '@theia/core/lib/common/contribution-provider';
import { BackendApplication as TheiaBackendApplication, BackendApplicationContribution, BackendApplicationCliContribution } from '@theia/core/lib/node/backend-application';

@injectable()
export class BackendApplication extends TheiaBackendApplication {

    constructor(
        @inject(ContributionProvider) @named(BackendApplicationContribution) protected readonly contributionsProvider: ContributionProvider<BackendApplicationContribution>,
        @inject(BackendApplicationCliContribution) protected readonly cliParams: BackendApplicationCliContribution
    ) {
        super(contributionsProvider, cliParams);
        // Workaround for Electron not installing a handler to ignore SIGPIPE
        // (https://github.com/electron/electron/issues/13254)
        // From VS Code: https://github.com/microsoft/vscode/blob/d0c90c9f3ea8d34912194176241503a44b3abd80/src/bootstrap.js#L31-L37
        process.on('SIGPIPE', () => console.error(new Error('Unexpected SIGPIPE signal.')));
    }

}
