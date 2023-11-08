import { nls } from '@theia/core/lib/common/nls';
import {
  QuickPickItem,
  QuickPickService,
} from '@theia/core/lib/common/quick-pick-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Programmer } from '../../common/protocol';
import { BoardsDataStore } from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { CommandRegistry, Contribution } from './contribution';

class ProgrammerQuickPickItem implements QuickPickItem {
  constructor(
    readonly programmer: Readonly<Programmer>,
    readonly label = programmer.name,
    readonly description = programmer.id
  ) {}
}

@injectable()
export class SelectProgrammer extends Contribution {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;
  @inject(QuickPickService)
  private readonly quickPickService: QuickPickService;

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SelectProgrammer.Commands.SELECT_PROGRAMMER, {
      execute: () =>
        this.selectProgrammer(
          this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn
        ),
    });
  }

  private async pickProgrammer(
    fqbn: string | undefined
  ): Promise<Programmer | undefined> {
    const { programmers, selectedProgrammer } =
      await this.boardsDataStore.getData(fqbn);
    if (!programmers.length) {
      return undefined;
    }
    const items = programmers.map((p) => new ProgrammerQuickPickItem(p));
    const activeItem = items.find(
      (i) => i.programmer.id === selectedProgrammer?.id
    );
    const selected = await this.quickPickService.show(items, {
      activeItem,
      placeholder: nls.localize(
        'arduino/quickSelectProgrammer',
        'Type the programmer. Press Enter to confirm or Escape to cancel.'
      ),
      matchOnDescription: true,
    });
    return selected?.programmer;
  }

  private async selectProgrammer(
    fqbn: string | undefined
  ): Promise<Programmer | undefined> {
    if (!fqbn) {
      return undefined;
    }
    const programmer = await this.pickProgrammer(fqbn);
    if (programmer) {
      const ok = await this.boardsDataStore.selectProgrammer({
        fqbn,
        selectedProgrammer: programmer,
      });
      if (ok) {
        return programmer;
      }
    }
    return undefined;
  }
}

export namespace SelectProgrammer {
  export namespace Commands {
    export const SELECT_PROGRAMMER = {
      id: 'arduino-select-programmer',
    };
  }
}
