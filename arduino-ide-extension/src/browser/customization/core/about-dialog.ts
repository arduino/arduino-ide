import { injectable, inject, postConstruct } from 'inversify';
import { AboutDialog as TheiaAboutDialog, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { ConfigService } from '../../../common/protocol/config-service';

@injectable()
export class AboutDialog extends TheiaAboutDialog {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @postConstruct()
    protected async init(): Promise<void> {
        const [, version] = await Promise.all([super.init(), this.configService.getVersion()]);
        if (version) {
            const { firstChild } = this.contentNode;
            if (firstChild instanceof HTMLElement && firstChild.classList.contains(ABOUT_CONTENT_CLASS)) {
                const cliVersion = document.createElement('div');
                cliVersion.textContent = version;
                firstChild.appendChild(cliVersion);
                // TODO: anchor to the commit in the `arduino-cli` repository.
            }
        }
    }

}
