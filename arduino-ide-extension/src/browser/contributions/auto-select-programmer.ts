import type { MaybePromise } from '@theia/core/lib/common/types';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  BoardDetails,
  Programmer,
  isBoardIdentifierChangeEvent,
} from '../../common/protocol';
import {
  BoardsDataStore,
  findDefaultProgrammer,
  isEmptyData,
} from '../boards/boards-data-store';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { Contribution } from './contribution';

/**
 * Before CLI 0.35.0-rc.3, there was no `programmer#default` property in the `board details` response.
 * This method does the programmer migration in the data store. If there is a programmer selected, it's a noop.
 * If no programmer is selected, it forcefully reloads the details from the CLI and updates it in the local storage.
 */
@injectable()
export class AutoSelectProgrammer extends Contribution {
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(BoardsDataStore)
  private readonly boardsDataStore: BoardsDataStore;

  override onStart(): void {
    this.boardsServiceProvider.onBoardsConfigDidChange((event) => {
      if (isBoardIdentifierChangeEvent(event)) {
        this.ensureProgrammerIsSelected();
      }
    });
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() =>
      this.ensureProgrammerIsSelected()
    );
  }

  private async ensureProgrammerIsSelected(): Promise<boolean> {
    return ensureProgrammerIsSelected({
      fqbn: this.boardsServiceProvider.boardsConfig.selectedBoard?.fqbn,
      getData: (fqbn) => this.boardsDataStore.getData(fqbn),
      loadBoardDetails: (fqbn) => this.boardsDataStore.loadBoardDetails(fqbn),
      selectProgrammer: (arg) => this.boardsDataStore.selectProgrammer(arg),
    });
  }
}

interface EnsureProgrammerIsSelectedParams {
  fqbn: string | undefined;
  getData: (fqbn: string | undefined) => MaybePromise<BoardsDataStore.Data>;
  loadBoardDetails: (fqbn: string) => MaybePromise<BoardDetails | undefined>;
  selectProgrammer(options: {
    fqbn: string;
    selectedProgrammer: Programmer;
  }): MaybePromise<boolean>;
}

export async function ensureProgrammerIsSelected(
  params: EnsureProgrammerIsSelectedParams
): Promise<boolean> {
  const { fqbn, getData, loadBoardDetails, selectProgrammer } = params;
  if (!fqbn) {
    return false;
  }
  console.debug(`Ensuring a programmer is selected for ${fqbn}...`);
  const data = await getData(fqbn);
  if (isEmptyData(data)) {
    // For example, the platform is not installed.
    console.debug(`Skipping. No boards data is available for ${fqbn}.`);
    return false;
  }
  if (data.selectedProgrammer) {
    console.debug(
      `A programmer is already selected for ${fqbn}: '${data.selectedProgrammer.id}'.`
    );
    return true;
  }
  let programmer = findDefaultProgrammer(data.programmers, data);
  if (programmer) {
    // select the programmer if the default info is available
    const result = await selectProgrammer({
      fqbn,
      selectedProgrammer: programmer,
    });
    if (result) {
      console.debug(`Selected '${programmer.id}' programmer for ${fqbn}.`);
      return result;
    }
  }
  console.debug(`Reloading board details for ${fqbn}...`);
  const reloadedData = await loadBoardDetails(fqbn);
  if (!reloadedData) {
    console.debug(`Skipping. No board details found for ${fqbn}.`);
    return false;
  }
  if (!reloadedData.programmers.length) {
    console.debug(`Skipping. ${fqbn} does not have programmers.`);
    return false;
  }
  programmer = findDefaultProgrammer(reloadedData.programmers, reloadedData);
  if (!programmer) {
    console.debug(
      `Skipping. Could not find a default programmer for ${fqbn}. Programmers were: `
    );
    return false;
  }
  const result = await selectProgrammer({
    fqbn,
    selectedProgrammer: programmer,
  });
  if (result) {
    console.debug(`Selected '${programmer.id}' programmer for ${fqbn}.`);
  } else {
    console.debug(
      `Could not select '${programmer.id}' programmer for ${fqbn}.`
    );
  }
  return result;
}
