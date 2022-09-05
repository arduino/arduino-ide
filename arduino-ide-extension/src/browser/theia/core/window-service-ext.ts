import type { StartupTask } from '../../../electron-common/startup-task';

export const WindowServiceExt = Symbol('WindowServiceExt');
export interface WindowServiceExt {
  /**
   * Returns with a promise that resolves to `true` if the current window is the first window.
   */
  isFirstWindow(): Promise<boolean>;
  reload(options?: StartupTask.Owner): void;
}
