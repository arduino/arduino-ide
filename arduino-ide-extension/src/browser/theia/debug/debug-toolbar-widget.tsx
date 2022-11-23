import { ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { CommandRegistry } from '@theia/core/lib/common/command';
import {
  ActionMenuNode,
  CompositeMenuNode,
  MenuModelRegistry,
} from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { DebugState } from '@theia/debug/lib/browser/debug-session';
import { DebugAction } from './debug-action';
import { DebugToolBar as TheiaDebugToolbar } from '@theia/debug/lib/browser/view/debug-toolbar-widget';

@injectable()
export class DebugToolbar extends TheiaDebugToolbar {
  @inject(CommandRegistry) private readonly commandRegistry: CommandRegistry;
  @inject(MenuModelRegistry)
  private readonly menuModelRegistry: MenuModelRegistry;
  @inject(ContextKeyService)
  private readonly contextKeyService: ContextKeyService;

  protected override render(): React.ReactNode {
    const { state } = this.model;
    return (
      <React.Fragment>
        {this.renderContributedCommands()}
        {this.renderContinue()}
        <DebugAction
          enabled={state === DebugState.Stopped}
          run={this.stepOver}
          label={nls.localizeByDefault('Step Over')}
          iconClass="debug-step-over"
          ref={this.setStepRef}
        />
        <DebugAction
          enabled={state === DebugState.Stopped}
          run={this.stepIn}
          label={nls.localizeByDefault('Step Into')}
          iconClass="debug-step-into"
        />
        <DebugAction
          enabled={state === DebugState.Stopped}
          run={this.stepOut}
          label={nls.localizeByDefault('Step Out')}
          iconClass="debug-step-out"
        />
        <DebugAction
          enabled={state !== DebugState.Inactive}
          run={this.restart}
          label={nls.localizeByDefault('Restart')}
          iconClass="debug-restart"
        />
        {this.renderStart()}
      </React.Fragment>
    );
  }

  private renderContributedCommands(): React.ReactNode {
    return this.menuModelRegistry
      .getMenu(TheiaDebugToolbar.MENU)
      .children.filter((node) => node instanceof CompositeMenuNode)
      .map((node) => (node as CompositeMenuNode).children)
      .reduce((acc, curr) => acc.concat(curr), [])
      .filter((node) => node instanceof ActionMenuNode)
      .map((node) => this.debugAction(node as ActionMenuNode));
  }

  private debugAction(node: ActionMenuNode): React.ReactNode {
    const { label, command, when, icon: iconClass = '' } = node;
    const run = () => this.commandRegistry.executeCommand(command);
    const enabled = when ? this.contextKeyService.match(when) : true;
    return (
      enabled && (
        <DebugAction
          key={command}
          enabled={enabled}
          label={label}
          iconClass={iconClass}
          run={run}
        />
      )
    );
  }
}
