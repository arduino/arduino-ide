import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution, codicon } from '@theia/core/lib/browser';
import { DecodeWidget } from './decode-widget';
import { MenuModelRegistry, Command, CommandRegistry } from '@theia/core';
import {
  TabBarToolbarContribution,
  TabBarToolbarRegistry,
} from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';
import { ArduinoMenus } from '../../menu/arduino-menus';

export namespace DebugBox {
  export namespace Commands {
    export const CLEAR_OUTPUT = Command.toLocalizedCommand(
      {
        id: 'debug-box-clear-output',
        label: 'Clear Output',
        iconClass: codicon('clear-all'),
      },
      'vscode/output.contribution/clearOutput.label'
    );
  }
}

@injectable()
export class DecodeViewContribution
  extends AbstractViewContribution<DecodeWidget>
  implements TabBarToolbarContribution
{
  static readonly TOGGLE_DECODE_BOX = DecodeWidget.ID + ':toggle';
  static readonly TOGGLE_DECODE_BOX_TOOLBAR =
  DecodeWidget.ID + ':toggle-toolbar';
  static readonly RESET_DECODE_BOX = DecodeWidget.ID + ':reset';

  constructor() {
    super({
      widgetId: DecodeWidget.ID,
      widgetName: DecodeWidget.LABEL,
      defaultWidgetOptions: {
        area: 'bottom',
      },
      toggleCommandId: DecodeViewContribution.TOGGLE_DECODE_BOX,
      toggleKeybinding: 'CtrlCmd+Shift+D',
    });
  }

  override registerMenus(menus: MenuModelRegistry): void {
    if (this.toggleCommand) {
      menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
        commandId: this.toggleCommand.id,
        label: DecodeWidget.LABEL,
        order: '6',
      });
    }
  }

  registerToolbarItems(registry: TabBarToolbarRegistry): void {
    registry.registerItem({
      id: DebugBox.Commands.CLEAR_OUTPUT.id,
      command: DebugBox.Commands.CLEAR_OUTPUT.id,
      tooltip: 'Clear Output'
    });
  }

  override registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(DebugBox.Commands.CLEAR_OUTPUT, {
      isEnabled: (widget) => widget instanceof DecodeWidget,
      isVisible: (widget) => widget instanceof DecodeWidget,
      execute: (widget) => {
        if (widget instanceof DecodeWidget) {
          widget.clearConsole();
        }
      },
    });
    if (this.toggleCommand) {
      commands.registerCommand(this.toggleCommand, {
        execute: () => this.toggle(),
      });
      commands.registerCommand(
        { id: DecodeViewContribution.TOGGLE_DECODE_BOX_TOOLBAR },
        {
          isVisible: (widget) =>
            ArduinoToolbar.is(widget) && widget.side === 'right',
          execute: () => this.toggle(),
        }
      );
    }
    commands.registerCommand(
      { id: DecodeViewContribution.RESET_DECODE_BOX },
      { execute: () => this.reset() }
    );
  }

  protected async toggle(): Promise<void> {
    const widget = this.tryGetWidget();
    if (widget) {
      widget.dispose();
    } else {
      await this.openView({ activate: true, reveal: true });
    }
  }

  protected async reset(): Promise<void> {
    const widget = this.tryGetWidget();
    if (widget) {
      widget.dispose();
      await this.openView({ activate: true, reveal: true });
    }
  }
}
