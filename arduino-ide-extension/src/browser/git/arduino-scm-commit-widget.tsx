import { CommandRegistry } from '@theia/core/lib/common/command';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ScmCommitWidget } from '@theia/scm/lib/browser/scm-commit-widget';
import { ArduinoGitCommands } from './arduino-git-contribution';

@injectable()
export class ArduinoScmCommitWidget extends ScmCommitWidget {
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  constructor(
    @inject(ContextMenuRenderer)
    contextMenuRenderer: ContextMenuRenderer
  ) {
    super(contextMenuRenderer);
  }

  protected override render(): React.ReactNode {
    const repository = this.scmService.selectedRepository;
    if (!repository) {
      return undefined;
    }
    return (
      <div {...this.createContainerAttributes()}>
        {this.renderInput(repository.input)}
        {this.renderCommitActions(
          repository.input.value,
          repository.input.enabled
        )}
      </div>
    );
  }

  private renderCommitActions(
    message: string,
    inputEnabled: boolean
  ): React.ReactNode {
    const commitEnabled = inputEnabled && Boolean(message.trim());
    const commitLabel = nls.localize('arduino/git/commitButton', 'Commit');
    return (
      <div className="arduino-scm-commit-actions">
        <button
          className="arduino-scm-commit-main"
          disabled={!commitEnabled}
          title={nls.localize(
            'arduino/git/commitButtonTitle',
            'Commit staged changes'
          )}
          onClick={() =>
            this.commandRegistry.executeCommand(
              ArduinoGitCommands.GIT_COMMIT.id
            )
          }
        >
          <span className="codicon codicon-check" />
          <span>{commitLabel}</span>
        </button>
        <button
          className="arduino-scm-commit-more"
          disabled={!commitEnabled}
          title={nls.localize(
            'arduino/git/commitOptionsButtonTitle',
            'Commit options'
          )}
          onClick={() =>
            this.commandRegistry.executeCommand(
              ArduinoGitCommands.GIT_COMMIT_OPTIONS.id
            )
          }
        >
          <span className="codicon codicon-chevron-down" />
        </button>
      </div>
    );
  }
}
