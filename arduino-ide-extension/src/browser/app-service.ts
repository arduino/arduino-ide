import type { Disposable } from '@theia/core/lib/common/disposable';
import type { StartupTasks } from '../electron-common/startup-task';
import type { Sketch } from './contributions/contribution';

export const AppService = Symbol('AppService');
export interface AppService {
  quit(): void;
  version(): Promise<string>;
  registerStartupTasksHandler(
    handler: (tasks: StartupTasks) => void
  ): Disposable;
  scheduleDeletion(sketch: Sketch): void; // TODO: find a better place
}
