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

// 导出一个函数，用于判断参数是否为StartupTasks类型
export function hasStartupTasks(arg: unknown): arg is unknown & StartupTasks {
  // 判断参数是否为对象类型
  if (typeof arg === 'object') {
    // 判断参数是否为StartupTasks类型
    return (
      // 判断参数的tasks属性是否为undefined
      (<StartupTasks>arg).tasks !== undefined &&
      // 判断参数的tasks属性是否为数组类型
      Array.isArray((<StartupTasks>arg).tasks) &&
      // 判断参数的tasks属性是否为空数组
      Boolean((<StartupTasks>arg).tasks.length) &&
      // 判断参数的tasks属性是否为StartupTask类型
      (<StartupTasks>arg).tasks.every(isStartupTask)
    );
  }
  // 如果参数不是对象类型，则返回false
  return false;
}
