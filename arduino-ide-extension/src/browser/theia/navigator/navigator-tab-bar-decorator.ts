import { injectable } from '@theia/core/shared/inversify';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { NavigatorTabBarDecorator as TheiaNavigatorTabBarDecorator } from '@theia/navigator/lib/browser/navigator-tab-bar-decorator';

/**
 * To silent the badge decoration in the `Explorer`.
 * https://github.com/eclipse-theia/theia/issues/8709
 */
@injectable()
export class NavigatorTabBarDecorator extends TheiaNavigatorTabBarDecorator {
  override onStart(): void {
    // NOOP
  }

  override decorate(): WidgetDecoration.Data[] {
    // Does not decorate anything.
    return [];
  }
}
