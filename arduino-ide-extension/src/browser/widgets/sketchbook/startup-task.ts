import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceInput as TheiaWorkspaceInput } from '@theia/workspace/lib/browser';
import { Contribution } from '../../contributions/contribution';

export interface Task {
  command: string;
  /**
   * This must be JSON serializable.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
}

@injectable()
export class StartupTask extends Contribution {
  override onReady(): void {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(StartupTask.QUERY_STRING);
    if (!encoded) return;

    const commands = JSON.parse(decodeURIComponent(encoded));

    if (Array.isArray(commands)) {
      commands.forEach(({ command, args }) => {
        this.commandService.executeCommand(command, ...args);
      });
    }
  }
}
export namespace StartupTask {
  export const QUERY_STRING = 'startupTasks';
  export interface WorkspaceInput extends TheiaWorkspaceInput {
    tasks: Task[];
  }
  export namespace WorkspaceInput {
    export function is(
      input: (TheiaWorkspaceInput & Partial<WorkspaceInput>) | undefined
    ): input is WorkspaceInput {
      return !!input && !!input.tasks;
    }
  }
}
