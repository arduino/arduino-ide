import * as remote from '@theia/core/electron-shared/@electron/remote';
import type { IpcRendererEvent } from '@theia/core/electron-shared/electron';
import { ipcRenderer } from '@theia/core/electron-shared/electron';
import { injectable } from '@theia/core/shared/inversify';
import { StartupTask } from '../../electron-common/startup-task';
import { Contribution } from './contribution';

@injectable()
export class StartupTasks extends Contribution {
  override onReady(): void {
    ipcRenderer.once(
      StartupTask.Messaging.STARTUP_TASKS_SIGNAL,
      (_: IpcRendererEvent, args: unknown) => {
        console.debug(
          `Received the startup tasks from the electron main process. Args: ${JSON.stringify(
            args
          )}`
        );
        if (!StartupTask.has(args)) {
          console.warn(`Could not detect 'tasks' from the signal. Skipping.`);
          return;
        }
        const tasks = args.tasks;
        if (tasks.length) {
          console.log(`Executing startup tasks:`);
          tasks.forEach(({ command, args = [] }) => {
            console.log(
              ` - '${command}' ${
                args.length ? `, args: ${JSON.stringify(args)}` : ''
              }`
            );
            this.commandService
              .executeCommand(command, ...args)
              .catch((err) =>
                console.error(
                  `Error occurred when executing the startup task '${command}'${
                    args?.length ? ` with args: '${JSON.stringify(args)}` : ''
                  }.`,
                  err
                )
              );
          });
        }
      }
    );
    const { id } = remote.getCurrentWindow();
    console.debug(
      `Signalling app ready event to the electron main process. Sender ID: ${id}.`
    );
    ipcRenderer.send(StartupTask.Messaging.APP_READY_SIGNAL(id));
  }
}
