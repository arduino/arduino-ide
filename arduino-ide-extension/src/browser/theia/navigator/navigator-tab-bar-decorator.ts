import { injectable } from 'inversify';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { NavigatorTabBarDecorator as TheiaNavigatorTabBarDecorator } from '@theia/navigator/lib/browser/navigator-tab-bar-decorator';

/**
 * To silent the badge decoration in the `Explorer`.
 * https://github.com/eclipse-theia/theia/issues/8709
 */
@injectable()
export class NavigatorTabBarDecorator extends TheiaNavigatorTabBarDecorator {

    onStart(): void {
        // NOOP
    }

    decorate(): WidgetDecoration.Data[] {
        // Does not decorate anything.
        return [];
    }

}
