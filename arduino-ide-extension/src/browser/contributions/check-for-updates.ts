import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { InstallManually, Later } from '../../common/nls';
import {
  ArduinoComponent,
  BoardsPackage,
  BoardsService,
  LibraryPackage,
  LibraryService,
  ResponseServiceClient,
  Searchable,
} from '../../common/protocol';
import { Contribution, CommandRegistry, Command } from './contribution';
import { Installable } from '../../common/protocol/installable';
import { ExecuteWithProgress } from '../../common/protocol/progressible';
import { WindowServiceExt } from '../theia/core/window-service-ext';
import { BoardsListWidgetFrontendContribution } from '../boards/boards-widget-frontend-contribution';
import { LibraryListWidgetFrontendContribution } from '../library/library-widget-frontend-contribution';
import { ListWidget } from '../widgets/component-list/list-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

const NoUpdates = nls.localize(
  'arduino/checkForUpdates/noUpdates',
  'No updates were found.'
);
const UpdatesBoards = nls.localize(
  'arduino/checkForUpdates/updatedBoth',
  'Updates are available for some of your boards.'
);
const UpdatesLibraries = nls.localize(
  'arduino/checkForUpdates/updatedBoth',
  'Updates are available for some of your libraries.'
);
const InstallAll = nls.localize(
  'arduino/checkForUpdates/installAll',
  'Install All'
);

interface Task<T extends ArduinoComponent> {
  run: () => Promise<void>;
  item: T;
}

@injectable()
export class CheckForUpdates extends Contribution {
  @inject(WindowServiceExt)
  private readonly windowService: WindowServiceExt;
  @inject(LibraryService)
  private readonly libraryService: LibraryService;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;
  @inject(BoardsListWidgetFrontendContribution)
  private readonly boardsContribution: BoardsListWidgetFrontendContribution;
  @inject(LibraryListWidgetFrontendContribution)
  private readonly librariesContribution: LibraryListWidgetFrontendContribution;

  override registerCommands(register: CommandRegistry): void {
    register.registerCommand(CheckForUpdates.Commands.CHECK_FOR_UPDATES, {
      execute: () => this.checkForUpdates(false),
    });
  }

  override async onReady(): Promise<void> {
    const checkForUpdates = this.preferences['arduino.checkForUpdates'];
    if (checkForUpdates) {
      this.windowService.isFirstWindow().then((firstWindow) => {
        if (firstWindow) {
          this.checkForUpdates();
        }
      });
    }
  }

  private async checkForUpdates(silent = true) {
    const [libraryPackages, boardsPackages] = await Promise.all([
      this.libraryService.updateables(),
      this.boardsService.updateables(),
    ]);
    this.promptUpdateBoards(boardsPackages);
    this.promptUpdateLibraries(libraryPackages);
    // const args = this.infoArgs(libraryPackages, boardsPackages);
    // if (args) {
    //   const { message, actions } = args;
    //   this.messageService.info(message, ...actions).then((answer) => {
    //     if (answer === InstallAll) {
    //       const tasks = this.installAllTasks(
    //         libraryPackages,
    //         boardsPackages,
    //         answer
    //       );
    //       return this.executeTasks(tasks);
    //     }
    //     // Install manually is not available if both boards and libraries can be updated.
    //     if (answer === InstallManually) {

    //     }
    //   });
    // } else if (!silent) {
    // }
    if (!libraryPackages.length && !boardsPackages.length && !silent) {
      this.messageService.info(NoUpdates);
    }
  }

  private promptUpdateLibraries(items: LibraryPackage[]): void {
    this.prompt(
      items,
      this.libraryService,
      this.librariesContribution,
      UpdatesLibraries
    );
  }

  private promptUpdateBoards(items: BoardsPackage[]): void {
    this.prompt(
      items,
      this.boardsService,
      this.boardsContribution,
      UpdatesBoards
    );
  }

  private prompt<T extends ArduinoComponent, S extends Searchable.Options>(
    items: T[],
    installable: Installable<T>,
    viewContribution: AbstractViewContribution<ListWidget<T, S>>,
    message: string
  ): void {
    if (!items.length) {
      return;
    }
    const actions = [Later, InstallManually, InstallAll];
    this.messageService.info(message, ...actions).then((answer) => {
      if (answer === InstallAll) {
        const tasks = items.map((item) => this.installTask(item, installable));
        return this.executeTasks(tasks);
      } else if (answer === InstallManually) {
        viewContribution
          .openView({ reveal: true })
          .then((widget) => widget.refresh(candidate.name.toLocaleLowerCase()));
      }
    });
  }

  private async executeTasks(tasks: Task<ArduinoComponent>[]): Promise<void> {
    if (tasks.length) {
      return ExecuteWithProgress.withProgress(
        nls.localize('arduino/checkForUpdates/updating', 'Updating'),
        this.messageService,
        async (progress) => {
          const total = tasks.length;
          let count = 0;
          for (const { run, item } of tasks) {
            progress.report({
              message: item.name,
            });
            await run();
            progress.report({ work: { total, done: ++count } });
          }
        }
      );
    }
  }

  private installTask<T extends ArduinoComponent>(
    item: T,
    installable: Installable<T>
  ): Task<T> {
    const latestVersion = item.availableVersions[0];
    return {
      item,
      run: () =>
        Installable.installWithProgress({
          installable,
          item,
          version: latestVersion,
          messageService: this.messageService,
          responseService: this.responseService,
          keepOutput: true,
        }),
    };
  }
}
export namespace CheckForUpdates {
  export namespace Commands {
    export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand(
      {
        id: 'arduino-check-for-updates',
        label: 'Check for Arduino Updates',
        category: 'Arduino',
      },
      'arduino/checkForUpdates/checkForUpdates'
    );
  }
}
