import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceInput as TheiaWorkspaceInput } from '@theia/workspace/lib/browser';
import { Contribution } from '../../contributions/contribution';
import { setURL } from '../../utils/window';

@injectable()
export class StartupTasks extends Contribution {
  override onReady(): void {
    const tasks = StartupTask.get(new URL(window.location.href));
    console.log(`Executing startup tasks: ${JSON.stringify(tasks)}`);
    tasks.forEach(({ command, args = [] }) =>
      this.commandService
        .executeCommand(command, ...args)
        .catch((err) =>
          console.error(
            `Error occurred when executing the startup task '${command}'${
              args?.length ? ` with args: '${JSON.stringify(args)}` : ''
            }.`,
            err
          )
        )
    );
    if (tasks.length) {
      // Remove the startup tasks after the execution.
      // Otherwise, IDE2 executes them again on a window reload event.
      setURL(StartupTask.set([], new URL(window.location.href)));
      console.info(`Removed startup tasks from URL.`);
    }
  }
}

export interface StartupTask {
  command: string;
  /**
   * Must be JSON serializable.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
}
export namespace StartupTask {
  const QUERY = 'startupTasks';
  export function is(arg: unknown): arg is StartupTasks {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return 'command' in object && typeof object['command'] === 'string';
    }
    return false;
  }
  export function get(url: URL): StartupTask[] {
    const { searchParams } = url;
    const encodedTasks = searchParams.get(QUERY);
    if (encodedTasks) {
      const rawTasks = decodeURIComponent(encodedTasks);
      const tasks = JSON.parse(rawTasks);
      if (Array.isArray(tasks)) {
        return tasks.filter((task) => {
          if (StartupTask.is(task)) {
            return true;
          }
          console.warn(`Was not a task: ${JSON.stringify(task)}. Ignoring.`);
          return false;
        });
      } else {
        debugger;
        console.warn(`Startup tasks was not an array: ${rawTasks}. Ignoring.`);
      }
    }
    return [];
  }
  export function set(tasks: StartupTask[], url: URL): URL {
    const copy = new URL(url);
    copy.searchParams.set(QUERY, encodeURIComponent(JSON.stringify(tasks)));
    return copy;
  }
  export function append(tasks: StartupTask[], url: URL): URL {
    return set([...get(url), ...tasks], url);
  }
}

export namespace StartupTasks {
  export interface WorkspaceInput extends TheiaWorkspaceInput {
    tasks: StartupTask[];
  }
  export namespace WorkspaceInput {
    export function is(
      input: (TheiaWorkspaceInput & Partial<WorkspaceInput>) | undefined
    ): input is WorkspaceInput {
      return !!input && !!input.tasks;
    }
  }
}
