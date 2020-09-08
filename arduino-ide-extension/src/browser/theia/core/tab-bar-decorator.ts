import { inject, injectable, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Title, Widget } from '@phosphor/widgets';
import { ILogger } from '@theia/core/lib/common/logger';
import { EditorWidget } from '@theia/editor/lib/browser';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { TabBarDecoratorService as TheiaTabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { ConfigService } from '../../../common/protocol/config-service';

@injectable()
export class TabBarDecoratorService extends TheiaTabBarDecoratorService {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(ILogger)
    protected readonly logger: ILogger;

    protected dataDirUri: URI | undefined;

    @postConstruct()
    protected init(): void {
        this.configService.getConfiguration()
            .then(({ dataDirUri }) => this.dataDirUri = new URI(dataDirUri))
            .catch(err => this.logger.error(`Failed to determine the data directory: ${err}`));
    }

    getDecorations(title: Title<Widget>): WidgetDecoration.Data[] {
        if (title.owner instanceof EditorWidget) {
            const editor = title.owner.editor;
            if (this.dataDirUri && this.dataDirUri.isEqualOrParent(editor.uri)) {
                return [];
            }
        }
        return super.getDecorations(title);
    }

}
