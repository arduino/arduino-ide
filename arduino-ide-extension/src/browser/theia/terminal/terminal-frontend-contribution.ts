import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { injectable } from '@theia/core/shared/inversify';
import {
  TerminalCommands,
  TerminalFrontendContribution as TheiaTerminalFrontendContribution,
} from '@theia/terminal/lib/browser/terminal-frontend-contribution';

@injectable()
export class TerminalFrontendContribution extends TheiaTerminalFrontendContribution {
  override registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    super.registerToolbarItems(toolbar);
    // removes the `split-terminal` command from the tabbar toolbar
    // https://github.com/dankeboy36/esp-exception-decoder/pull/1#pullrequestreview-1500146673
    toolbar.unregisterItem(TerminalCommands.SPLIT.id);
  }
}
