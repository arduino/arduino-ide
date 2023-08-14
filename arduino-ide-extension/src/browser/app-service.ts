import type { Disposable } from '@theia/core/lib/common/disposable';
import type { AppInfo } from '../electron-common/electron-arduino';
import type { StartupTasks } from '../electron-common/startup-task';
import type { Sketch } from './contributions/contribution';

export type { AppInfo };

export const AppService = Symbol('AppService');
export interface AppService {
  quit(): void;
  info(): Promise<AppInfo>;
  registerStartupTasksHandler(
    handler: (tasks: StartupTasks) => void
  ): Disposable;
  scheduleDeletion(sketch: Sketch): void; // TODO: find a better place
}
