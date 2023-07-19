import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { Title, Widget } from '@theia/core/shared/@phosphor/widgets';
import { EditorWidget } from '@theia/editor/lib/browser';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { TabBarDecoratorService as TheiaTabBarDecoratorService } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { ConfigServiceClient } from '../../config/config-service-client';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class TabBarDecoratorService extends TheiaTabBarDecoratorService {
  @inject(ConfigServiceClient)
  private readonly configService: ConfigServiceClient;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private dataDirUri: URI | undefined;

  @postConstruct()
  protected init(): void {
    const fireDidChange = () =>
      this.appStateService
        .reachedState('ready')
        .then(() => this.fireDidChangeDecorations());
    this.dataDirUri = this.configService.tryGetDataDirUri();
    this.configService.onDidChangeDataDirUri((dataDirUri) => {
      this.dataDirUri = dataDirUri;
      fireDidChange();
    });
    if (this.dataDirUri) {
      fireDidChange();
    }
  }

  override getDecorations(title: Title<Widget>): WidgetDecoration.Data[] {
    if (title.owner instanceof EditorWidget) {
      const editor = title.owner.editor;
      if (this.dataDirUri && this.dataDirUri.isEqualOrParent(editor.uri)) {
        return [];
      }
    }
    return super.getDecorations(title);
  }
}
