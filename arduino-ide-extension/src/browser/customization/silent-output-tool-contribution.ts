import { OutputToolbarContribution } from '@theia/output/lib/browser/output-toolbar-contribution';
import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { injectable } from 'inversify';

@injectable()
export class ArduinoOutputToolContribution extends OutputToolbarContribution {

    async registerToolbarItems(toolbarRegistry: TabBarToolbarRegistry): Promise<void> {
    }

}
