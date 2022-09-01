import PQueue from 'p-queue';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { BoardsServiceProvider } from './boards-service-provider';
import {
  BoardIdentifier,
  ConfigOption,
  isBoardIdentifierChangeEvent,
  Programmer,
} from '../../common/protocol';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { BoardsDataStore } from './boards-data-store';
import { MainMenuManager } from '../../common/main-menu-manager';
import { ArduinoMenus, unregisterSubmenu } from '../menu/arduino-menus';
import { nls } from '@theia/core/lib/common';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

@injectable()
export class BoardsDataMenuUpdater implements FrontendApplicationContribution {
  @inject(CommandRegistry)
  protected readonly commandRegistry: CommandRegistry;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(MainMenuManager)
  protected readonly mainMenuManager: MainMenuManager;

  @inject(BoardsDataStore)
  protected readonly boardsDataStore: BoardsDataStore;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  protected readonly queue = new PQueue({ autoStart: true, concurrency: 1 });
  protected readonly toDisposeOnBoardChange = new DisposableCollection();

  async onStart(): Promise<void> {
    this.appStateService
      .reachedState('ready')
      .then(() =>
        this.updateMenuActions(
          this.boardsServiceProvider.boardsConfig.selectedBoard
        )
      );
    this.boardsDataStore.onChanged(() =>
      this.updateMenuActions(this.boardsServiceProvider.boardsConfig.selectedBoard)
    );
    this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
      if (isBoardIdentifierChangeEvent(event)) {
        this.updateMenuActions(event.selectedBoard);
      }
    });
  }

  protected async updateMenuActions(
    selectedBoard: BoardIdentifier | undefined
  ): Promise<void> {
    return this.queue.add(async () => {
      this.toDisposeOnBoardChange.dispose();
      this.mainMenuManager.update();
      if (selectedBoard) {
        const { fqbn } = selectedBoard;
        if (fqbn) {
          const { configOptions, programmers, selectedProgrammer } =
            await this.boardsDataStore.getData(fqbn);
          if (configOptions.length) {
            const boardsConfigMenuPath = [
              ...ArduinoMenus.TOOLS__BOARD_SETTINGS_GROUP,
              'z01_boardsConfig',
            ]; // `z_` is for ordering.
            for (const { label, option, values } of configOptions.sort(
              ConfigOption.LABEL_COMPARATOR
            )) {
              const menuPath = [...boardsConfigMenuPath, `${option}`];
              const commands = new Map<
                string,
                Disposable & { label: string }
              >();
              let selectedValue = '';
              for (const value of values) {
                const id = `${fqbn}-${option}--${value.value}`;
                const command = { id };
                const handler = {
                  execute: () =>
                    this.boardsDataStore.selectConfigOption({
                      fqbn,
                      option,
                      selectedValue: value.value,
                    }),
                  isToggled: () => value.selected,
                };
                commands.set(
                  id,
                  Object.assign(
                    this.commandRegistry.registerCommand(command, handler),
                    { label: value.label }
                  )
                );
                if (value.selected) {
                  selectedValue = value.label;
                }
              }
              this.menuRegistry.registerSubmenu(
                menuPath,
                `${label}${selectedValue ? `: "${selectedValue}"` : ''}`
              );
              this.toDisposeOnBoardChange.pushAll([
                ...commands.values(),
                Disposable.create(() =>
                  unregisterSubmenu(menuPath, this.menuRegistry)
                ),
                ...Array.from(commands.keys()).map((commandId, i) => {
                  const { label } = commands.get(commandId)!;
                  this.menuRegistry.registerMenuAction(menuPath, {
                    commandId,
                    order: String(i).padStart(4),
                    label,
                  });
                  return Disposable.create(() =>
                    this.menuRegistry.unregisterMenuAction(commandId)
                  );
                }),
              ]);
            }
          }
          if (programmers.length) {
            const programmersMenuPath = [
              ...ArduinoMenus.TOOLS__BOARD_SETTINGS_GROUP,
              'z02_programmers',
            ];
            const programmerNls = nls.localize(
              'arduino/board/programmer',
              'Programmer'
            );
            const label = selectedProgrammer
              ? `${programmerNls}: "${selectedProgrammer.name}"`
              : programmerNls;
            this.menuRegistry.registerSubmenu(programmersMenuPath, label);
            this.toDisposeOnBoardChange.push(
              Disposable.create(() =>
                unregisterSubmenu(programmersMenuPath, this.menuRegistry)
              )
            );
            for (const programmer of programmers) {
              const { id, name } = programmer;
              const command = { id: `${fqbn}-programmer--${id}` };
              const handler = {
                execute: () =>
                  this.boardsDataStore.selectProgrammer({
                    fqbn,
                    selectedProgrammer: programmer,
                  }),
                isToggled: () =>
                  Programmer.equals(programmer, selectedProgrammer),
              };
              this.menuRegistry.registerMenuAction(programmersMenuPath, {
                commandId: command.id,
                label: name,
              });
              this.commandRegistry.registerCommand(command, handler);
              this.toDisposeOnBoardChange.pushAll([
                Disposable.create(() =>
                  this.commandRegistry.unregisterCommand(command)
                ),
                Disposable.create(() =>
                  this.menuRegistry.unregisterMenuAction(command.id)
                ),
              ]);
            }
          }
          this.mainMenuManager.update();
        }
      }
    });
  }
}
