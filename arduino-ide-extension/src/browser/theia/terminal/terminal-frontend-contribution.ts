import { TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { injectable } from '@theia/core/shared/inversify';
import { TerminalWidget } from '@theia/terminal/lib/browser/base/terminal-widget';
import {
  TerminalCommands,
  TerminalFrontendContribution as TheiaTerminalFrontendContribution,
} from '@theia/terminal/lib/browser/terminal-frontend-contribution';

// Patch for https://github.com/eclipse-theia/theia/pull/12626
@injectable()
export class TerminalFrontendContribution extends TheiaTerminalFrontendContribution {
  override registerCommands(commands: CommandRegistry): void {
    super.registerCommands(commands);
    commands.unregisterCommand(TerminalCommands.SPLIT);
    commands.registerCommand(TerminalCommands.SPLIT, {
      execute: () => this.splitTerminal(),
      isEnabled: (w) => this.withWidget(w, () => true),
      isVisible: (w) => this.withWidget(w, () => true),
    });
  }

  override registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
    super.registerToolbarItems(toolbar);
    toolbar.unregisterItem(TerminalCommands.SPLIT.id);
  }

  private withWidget<T>(
    widget: Widget | undefined,
    fn: (widget: TerminalWidget) => T
  ): T | false {
    if (widget instanceof TerminalWidget) {
      return fn(widget);
    }
    return false;
  }
}
