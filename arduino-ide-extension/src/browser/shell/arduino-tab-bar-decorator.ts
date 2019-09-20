import { inject, injectable, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Title, Widget } from '@phosphor/widgets';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { TabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { ConfigService } from '../../common/protocol/config-service';
import { EditorWidget } from '@theia/editor/lib/browser';

@injectable()
export class ArduinoTabBarDecoratorService extends TabBarDecoratorService {

    @inject(ConfigService)
    protected readonly configService: ConfigService;
    protected dataDirUri: URI | undefined;

    @postConstruct()
    protected init(): void {
        super.init();
        this.configService.getConfiguration().then(({ dataDirUri }) => this.dataDirUri = new URI(dataDirUri));
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
