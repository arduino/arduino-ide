import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import type { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { InstallManually, Later } from '../../common/nls';
import {
  ArduinoComponent,
  BoardSearch,
  BoardsPackage,
  BoardsService,
  LibraryPackage,
  LibrarySearch,
  LibraryService,
  ResponseServiceClient,
  Searchable,
  Updatable,
} from '../../common/protocol';
import { Installable } from '../../common/protocol/installable';
import { ExecuteWithProgress } from '../../common/protocol/progressible';
import { BoardsListWidgetFrontendContribution } from '../boards/boards-widget-frontend-contribution';
import { LibraryListWidgetFrontendContribution } from '../library/library-widget-frontend-contribution';
import { NotificationCenter } from '../notification-center';
import { WindowServiceExt } from '../theia/core/window-service-ext';
import type { ListWidget } from '../widgets/component-list/list-widget';
import { Command, CommandRegistry, Contribution } from './contribution';
import { Emitter } from '@theia/core';
import debounce = require('lodash.debounce');
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { ArduinoPreferences } from '../arduino-preferences';

const noUpdates = nls.localize(
  'arduino/checkForUpdates/noUpdates',
  'There are no recent updates available.'
);
const promptUpdateBoards = nls.localize(
  'arduino/checkForUpdates/promptUpdateBoards',
  'Updates are available for some of your boards.'
);
const promptUpdateLibraries = nls.localize(
  'arduino/checkForUpdates/promptUpdateLibraries',
  'Updates are available for some of your libraries.'
);
const updatingBoards = nls.localize(
  'arduino/checkForUpdates/updatingBoards',
  'Updating boards...'
);
const updatingLibraries = nls.localize(
  'arduino/checkForUpdates/updatingLibraries',
  'Updating libraries...'
);
const installAll = nls.localize(
  'arduino/checkForUpdates/installAll',
  'Install All'
);

interface Task<T extends ArduinoComponent> {
  readonly run: () => Promise<void>;
  readonly item: T;
}

const updatableLibrariesSearchOption: LibrarySearch = {
  query: '',
  topic: 'All',
  ...Updatable,
};
const updatableBoardsSearchOption: BoardSearch = {
  query: '',
  ...Updatable,
};
const installedLibrariesSearchOptions: LibrarySearch = {
  query: '',
  topic: 'All',
  type: 'Installed',
};
const installedBoardsSearchOptions: BoardSearch = {
  query: '',
  type: 'Installed',
};

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
    register.registerCommand(CheckForUpdates.Commands.SHOW_BOARDS_UPDATES, {
      execute: () =>
        this.showUpdatableItems(
          this.boardsContribution,
          updatableBoardsSearchOption
        ),
    });
    register.registerCommand(CheckForUpdates.Commands.SHOW_LIBRARY_UPDATES, {
      execute: () =>
        this.showUpdatableItems(
          this.librariesContribution,
          updatableLibrariesSearchOption
        ),
    });
    register.registerCommand(CheckForUpdates.Commands.SHOW_INSTALLED_BOARDS, {
      execute: () =>
        this.showUpdatableItems(
          this.boardsContribution,
          installedBoardsSearchOptions
        ),
    });
    register.registerCommand(
      CheckForUpdates.Commands.SHOW_INSTALLED_LIBRARIES,
      {
        execute: () =>
          this.showUpdatableItems(
            this.librariesContribution,
            installedLibrariesSearchOptions
          ),
      }
    );
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
      this.boardsService.search(updatableBoardsSearchOption),
      this.libraryService.search(updatableLibrariesSearchOption),
    ]);
    this.promptUpdateBoards(boardsPackages);
    this.promptUpdateLibraries(libraryPackages);
    if (!libraryPackages.length && !boardsPackages.length && !silent) {
      this.messageService.info(noUpdates);
    }
  }

  private promptUpdateBoards(items: BoardsPackage[]): void {
    this.prompt({
      items,
      installable: this.boardsService,
      viewContribution: this.boardsContribution,
      viewSearchOptions: updatableBoardsSearchOption,
      promptMessage: promptUpdateBoards,
      updatingMessage: updatingBoards,
    });
  }

  private promptUpdateLibraries(items: LibraryPackage[]): void {
    this.prompt({
      items,
      installable: this.libraryService,
      viewContribution: this.librariesContribution,
      viewSearchOptions: updatableLibrariesSearchOption,
      promptMessage: promptUpdateLibraries,
      updatingMessage: updatingLibraries,
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
      .info(message, Later, InstallManually, installAll)
      .then((answer) => {
        if (answer === installAll) {
          const tasks = items.map((item) =>
            this.createInstallTask(item, installable)
          );
          return this.executeTasks(updatingMessage, tasks);
        } else if (answer === InstallManually) {
          return this.showUpdatableItems(viewContribution, viewSearchOptions);
        }
      });
  }

  private async showUpdatableItems<
    T extends ArduinoComponent,
    S extends Searchable.Options
  >(
    viewContribution: AbstractViewContribution<ListWidget<T, S>>,
    viewSearchOptions: S
  ): Promise<void> {
    const widget = await viewContribution.openView({ reveal: true });
    widget.refresh(viewSearchOptions);
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
        label: 'Check for Arduino Updates',
        category: 'Arduino',
      },
      'arduino/checkForUpdates/checkForUpdates'
    );
    export const SHOW_BOARDS_UPDATES: Command & { label: string } = {
      id: 'arduino-show-boards-updates',
      label: nls.localize(
        'arduino/checkForUpdates/showBoardsUpdates',
        'Boards Updates'
      ),
      category: 'Arduino',
    };
    export const SHOW_LIBRARY_UPDATES: Command & { label: string } = {
      id: 'arduino-show-library-updates',
      label: nls.localize(
        'arduino/checkForUpdates/showLibraryUpdates',
        'Library Updates'
      ),
      category: 'Arduino',
    };
    export const SHOW_INSTALLED_BOARDS: Command & { label: string } = {
      id: 'arduino-show-installed-boards',
      label: nls.localize(
        'arduino/checkForUpdates/showInstalledBoards',
        'Installed Boards'
      ),
      category: 'Arduino',
    };
    export const SHOW_INSTALLED_LIBRARIES: Command & { label: string } = {
      id: 'arduino-show-installed-libraries',
      label: nls.localize(
        'arduino/checkForUpdates/showInstalledLibraries',
        'Installed Libraries'
      ),
      category: 'Arduino',
    };
  }
}

@injectable()
abstract class ComponentUpdates<T extends ArduinoComponent>
  implements FrontendApplicationContribution
{
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;
  @inject(ArduinoPreferences)
  private readonly preferences: ArduinoPreferences;
  @inject(NotificationCenter)
  protected readonly notificationCenter: NotificationCenter;
  private _updates: T[] | undefined;
  private readonly onDidChangeEmitter = new Emitter<T[]>();
  protected readonly toDispose = new DisposableCollection(
    this.onDidChangeEmitter
  );

  readonly onDidChange = this.onDidChangeEmitter.event;
  readonly refresh = debounce(() => this.refreshDebounced(), 200);

  onStart(): void {
    this.appStateService.reachedState('ready').then(() => this.refresh());
    this.toDispose.push(
      this.preferences.onPreferenceChanged(({ preferenceName, newValue }) => {
        if (
          preferenceName === 'arduino.checkForUpdates' &&
          typeof newValue === 'boolean'
        ) {
          this.refresh();
        }
      })
    );
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  get updates(): T[] | undefined {
    return this._updates;
  }

  /**
   * Search updatable components (libraries and platforms) via the CLI.
   */
  abstract searchUpdates(): Promise<T[]>;

  private async refreshDebounced(): Promise<void> {
    const checkForUpdates = this.preferences['arduino.checkForUpdates'];
    this._updates = checkForUpdates ? await this.searchUpdates() : [];
    this.onDidChangeEmitter.fire(this._updates.slice());
  }
}

@injectable()
export class LibraryUpdates extends ComponentUpdates<LibraryPackage> {
  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  override onStart(): void {
    super.onStart();
    this.toDispose.pushAll([
      this.notificationCenter.onLibraryDidInstall(() => this.refresh()),
      this.notificationCenter.onLibraryDidUninstall(() => this.refresh()),
    ]);
  }

  override searchUpdates(): Promise<LibraryPackage[]> {
    return this.libraryService.search(updatableLibrariesSearchOption);
  }
}

@injectable()
export class BoardsUpdates extends ComponentUpdates<BoardsPackage> {
  @inject(BoardsService)
  private readonly boardsService: BoardsService;

  override onStart(): void {
    super.onStart();
    this.toDispose.pushAll([
      this.notificationCenter.onPlatformDidInstall(() => this.refresh()),
      this.notificationCenter.onPlatformDidUninstall(() => this.refresh()),
      this.notificationCenter.onIndexUpdateDidComplete(() => this.refresh()),
    ]);
  }

  override searchUpdates(): Promise<BoardsPackage[]> {
    return this.boardsService.search(updatableBoardsSearchOption);
  }
}
