import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import {
  hasStartupTasks,
  StartupTasks,
} from '../../electron-common/startup-task';
import { AppService } from '../app-service';
import { Contribution } from './contribution';

@injectable()
export class StartupTasksExecutor extends Contribution {
  @inject(AppService)
  private readonly appService: AppService;

  private readonly toDispose = new DisposableCollection();

  @postConstruct()
  protected override init(): void {
    super.init();
    this.toDispose.push(
      this.appService.registerStartupTasksHandler((tasks) =>
        this.handleStartupTasks(tasks)
      )
    );
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  private async handleStartupTasks(tasks: StartupTasks): Promise<void> {
    console.debug(
      `Received the startup tasks from the electron main process. Args: ${JSON.stringify(
        tasks
      )}`
    );
    if (!hasStartupTasks(tasks)) {
      console.warn(`Could not detect 'tasks' from the signal. Skipping.`);
      return;
    }
    await this.appStateService.reachedState('ready');
    console.log(`Executing startup tasks:`);
    tasks.tasks.forEach(({ command, args = [] }) => {
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
