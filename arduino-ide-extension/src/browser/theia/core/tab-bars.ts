import { TabBar } from '@phosphor/widgets';
import { Saveable } from '@theia/core/lib/browser/saveable';
import { TabBarRenderer as TheiaTabBarRenderer } from '@theia/core/lib/browser/shell/tab-bars';

export class TabBarRenderer extends TheiaTabBarRenderer {

    createTabClass(data: TabBar.IRenderData<any>): string {
        let className = super.createTabClass(data);
        if (!data.title.closable && Saveable.isDirty(data.title.owner)) {
            className += ' p-mod-closable';
        }
        return className;
    }

}
