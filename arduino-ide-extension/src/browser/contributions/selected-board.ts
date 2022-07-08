import {
  StatusBar,
  StatusBarAlignment,
} from '@theia/core/lib/browser/status-bar/status-bar';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BoardsConfig } from '../boards/boards-config';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { Contribution } from './contribution';

@injectable()
export class SelectedBoard extends Contribution {
  @inject(StatusBar)
  private readonly statusBar: StatusBar;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  override onStart(): void {
    this.boardsServiceProvider.onBoardsConfigChanged((config) =>
      this.update(config)
    );
  }

  override onReady(): void {
    this.update(this.boardsServiceProvider.boardsConfig);
  }

  private update({ selectedBoard, selectedPort }: BoardsConfig.Config): void {
    this.statusBar.setElement('arduino-selected-board', {
      alignment: StatusBarAlignment.RIGHT,
      text: selectedBoard
        ? `$(microchip) ${selectedBoard.name}`
        : `$(close) ${nls.localize(
            'arduino/common/noBoardSelected',
            'No board selected'
          )}`,
      className: 'arduino-selected-board',
    });
    if (selectedBoard) {
      this.statusBar.setElement('arduino-selected-port', {
        alignment: StatusBarAlignment.RIGHT,
        text: selectedPort
          ? nls.localize(
              'arduino/common/selectedOn',
              'on {0}',
              selectedPort.address
            )
          : nls.localize('arduino/common/notConnected', '[not connected]'),
        className: 'arduino-selected-port',
      });
    }
  }
}
