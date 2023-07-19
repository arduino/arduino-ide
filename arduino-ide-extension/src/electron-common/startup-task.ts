export const StartupTaskProvider = Symbol('StartupTaskProvider');
export interface StartupTaskProvider {
  tasks(): StartupTask[];
}

export interface StartupTask {
  readonly command: string;
  /**
   * Must be JSON serializable.
   * See the restrictions [here](https://www.electronjs.org/docs/latest/api/web-contents#contentssendchannel-args).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly args?: any[];
}

export interface StartupTasks {
  readonly tasks: StartupTask[];
}

export function isStartupTask(arg: unknown): arg is StartupTask {
  if (typeof arg === 'object') {
    if (
      (<StartupTask>arg).command !== undefined &&
      typeof (<StartupTask>arg).command === 'string'
    ) {
      return (
        (<StartupTask>arg).args === undefined ||
        ((<StartupTask>arg).args !== undefined &&
          Array.isArray((<StartupTask>arg).args))
      );
    }
  }
  return false;
}

export function hasStartupTasks(arg: unknown): arg is unknown & StartupTasks {
  if (typeof arg === 'object') {
    return (
      (<StartupTasks>arg).tasks !== undefined &&
      Array.isArray((<StartupTasks>arg).tasks) &&
      Boolean((<StartupTasks>arg).tasks.length) &&
      (<StartupTasks>arg).tasks.every(isStartupTask)
    );
  }
  return false;
}
