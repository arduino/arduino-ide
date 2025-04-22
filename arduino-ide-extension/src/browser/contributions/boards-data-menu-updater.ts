import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import PQueue from 'p-queue';
import {
  BoardIdentifier,
  // Produces Error: src/browser/contributions/boards-data-menu-updater.ts(10,3): error TS6133: 'ConfigOption' is declared but its value is never read.
  // ConfigOption,
  isBoardIdentifierChangeEvent,
  Programmer,
} from '../../common/protocol';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { ArduinoMenus, unregisterSubmenu } from '../menu/arduino-menus';
import {
  CommandRegistry,
  Contribution,
  MenuModelRegistry,
} from './contribution';

@injectable()
export class BoardsDataMenuUpdater extends Contribution {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  private readonly queue = new PQueue({ autoStart: true, concurrency: 1 });
  private readonly toDisposeOnBoardChange = new DisposableCollection();

  override onStart(): void {
    this.boardsDataStore.onDidChange(() =>
      this.updateMenuActions(
        this.boardsServiceProvider.boardsConfig.selectedBoard
      )
    );
    this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
      if (isBoardIdentifierChangeEvent(event)) {
        this.updateMenuActions(event.selectedBoard);
      }
    });
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() =>
      this.updateMenuActions(
        this.boardsServiceProvider.boardsConfig.selectedBoard
      )
    );
  }

  private async updateMenuActions(
    selectedBoard: BoardIdentifier | undefined
  ): Promise<void> {
    return this.queue.add(async () => {
      this.toDisposeOnBoardChange.dispose();
      this.menuManager.update();
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
            for (const { label, option, values } of configOptions ) {
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
                      optionsToUpdate: [{ option, selectedValue: value.value }],
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
          this.menuManager.update();
        }
      }
    });
  }
}
