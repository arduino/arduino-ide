import type { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
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
import { Installable } from '../../common/protocol/installable';
import { ExecuteWithProgress } from '../../common/protocol/progressible';
import { BoardsListWidgetFrontendContribution } from '../boards/boards-widget-frontend-contribution';
import { LibraryListWidgetFrontendContribution } from '../library/library-widget-frontend-contribution';
import { WindowServiceExt } from '../theia/core/window-service-ext';
import type { ListWidget } from '../widgets/component-list/list-widget';
import { Command, CommandRegistry, Contribution } from './contribution';

const NoUpdates = nls.localize(
  'arduino/checkForUpdates/noUpdates',
  'There are no recent updates available.'
);
const PromptUpdateBoards = nls.localize(
  'arduino/checkForUpdates/promptUpdateBoards',
  'Updates are available for some of your boards.'
);
const PromptUpdateLibraries = nls.localize(
  'arduino/checkForUpdates/promptUpdateLibraries',
  'Updates are available for some of your libraries.'
);
const UpdatingBoards = nls.localize(
  'arduino/checkForUpdates/updatingBoards',
  'Updating boards...'
);
const UpdatingLibraries = nls.localize(
  'arduino/checkForUpdates/updatingLibraries',
  'Updating libraries...'
);
const InstallAll = nls.localize(
  'arduino/checkForUpdates/installAll',
  'Install All'
);

interface Task<T extends ArduinoComponent> {
  readonly run: () => Promise<void>;
  readonly item: T;
}

const Updatable = { type: 'Updatable' } as const;

@injectable()
export class CheckForUpdates extends Contribution {
  @inject(WindowServiceExt)
  private readonly windowService: WindowServiceExt;
  @inject(ResponseServiceClient)
  private readonly responseService: ResponseServiceClient;
  @inject(BoardsService)
  private readonly boardsService: BoardsService;
  @inject(LibraryService)
  private readonly libraryService: LibraryService;
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
    const [boardsPackages, libraryPackages] = await Promise.all([
      this.boardsService.search(Updatable),
      this.libraryService.search(Updatable),
    ]);
    this.promptUpdateBoards(boardsPackages);
    this.promptUpdateLibraries(libraryPackages);
    if (!libraryPackages.length && !boardsPackages.length && !silent) {
      this.messageService.info(NoUpdates);
    }
  }

  private promptUpdateBoards(items: BoardsPackage[]): void {
    this.prompt({
      items,
      installable: this.boardsService,
      viewContribution: this.boardsContribution,
      viewSearchOptions: { query: '', ...Updatable },
      promptMessage: PromptUpdateBoards,
      updatingMessage: UpdatingBoards,
    });
  }

  private promptUpdateLibraries(items: LibraryPackage[]): void {
    this.prompt({
      items,
      installable: this.libraryService,
      viewContribution: this.librariesContribution,
      viewSearchOptions: { query: '', topic: 'All', ...Updatable },
      promptMessage: PromptUpdateLibraries,
      updatingMessage: UpdatingLibraries,
    });
  }

  private prompt<
    T extends ArduinoComponent,
    S extends Searchable.Options
  >(options: {
    items: T[];
    installable: Installable<T>;
    viewContribution: AbstractViewContribution<ListWidget<T, S>>;
    viewSearchOptions: S;
    promptMessage: string;
    updatingMessage: string;
  }): void {
    const {
      items,
      installable,
      viewContribution,
      promptMessage: message,
      viewSearchOptions,
      updatingMessage,
    } = options;

    if (!items.length) {
      return;
    }
    this.messageService
      .info(message, Later, InstallManually, InstallAll)
      .then((answer) => {
        if (answer === InstallAll) {
          const tasks = items.map((item) =>
            this.createInstallTask(item, installable)
          );
          this.executeTasks(updatingMessage, tasks);
        } else if (answer === InstallManually) {
          viewContribution
            .openView({ reveal: true })
            .then((widget) => widget.refresh(viewSearchOptions));
        }
      });
  }

  private async executeTasks(
    message: string,
    tasks: Task<ArduinoComponent>[]
  ): Promise<void> {
    if (tasks.length) {
      return ExecuteWithProgress.withProgress(
        message,
        this.messageService,
        async (progress) => {
          try {
            const total = tasks.length;
            let count = 0;
            for (const { run, item } of tasks) {
              try {
                await run(); // runs update sequentially. // TODO: is parallel update desired?
              } catch (err) {
                console.error(err);
                this.messageService.error(
                  `Failed to update ${item.name}. ${err}`
                );
              } finally {
                progress.report({ work: { total, done: ++count } });
              }
            }
          } finally {
            progress.cancel();
          }
        }
      );
    }
  }

  private createInstallTask<T extends ArduinoComponent>(
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
        label: 'Check for board and library updates', //changing labelling from 'Check for Arduino updates' to 'Check for board and library updates' to adress #1646, changing translation files as well
        category: 'Arduino',
      },
      'arduino/checkForUpdates/checkForUpdates'
    );
  }
}
