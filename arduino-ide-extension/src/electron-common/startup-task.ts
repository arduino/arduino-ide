export interface StartupTask {
  command: string;
  /**
   * Must be JSON serializable.
   * See the restrictions [here](https://www.electronjs.org/docs/latest/api/web-contents#contentssendchannel-args).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[];
}
export namespace StartupTask {
  export function is(arg: unknown): arg is StartupTask {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'command' in object &&
        typeof object['command'] === 'string' &&
        (!('args' in object) || Array.isArray(object['args']))
      );
    }
    return false;
  }
  export function has(arg: unknown): arg is unknown & Owner {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'tasks' in object &&
        Array.isArray(object['tasks']) &&
        object['tasks'].every(is)
      );
    }
    return false;
  }
  export namespace Messaging {
    export const STARTUP_TASKS_SIGNAL = 'arduino/startupTasks';
    export function APP_READY_SIGNAL(id: number): string {
      return `arduino/appReady${id}`;
    }
  }

  export interface Owner {
    readonly tasks: StartupTask[];
  }
}

export const StartupTaskProvider = Symbol('StartupTaskProvider');
export interface StartupTaskProvider {
  tasks(): StartupTask[];
}
