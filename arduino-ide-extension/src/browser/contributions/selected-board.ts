import {
  StatusBar,
  StatusBarAlignment,
} from '@theia/core/lib/browser/status-bar/status-bar';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import type {
  BoardList,
  BoardListItem,
} from '../../common/protocol/board-list';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { Contribution } from './contribution';

@injectable()
export class SelectedBoard extends Contribution {
  @inject(StatusBar)
  private readonly statusBar: StatusBar;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  override onStart(): void {
    this.boardsServiceProvider.onBoardListDidChange((boardList) =>
      this.update(boardList)
    );
  }

  override onReady(): void {
    this.boardsServiceProvider.ready.then(() => this.update());
  }

  private update(
    boardList: BoardList = this.boardsServiceProvider.boardList
  ): void {
    const { selectedBoard, selectedPort } = boardList.boardsConfig;
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
      const notConnectedLabel = nls.localize(
        'arduino/common/notConnected',
        '[not connected]'
      );
      let portLabel = notConnectedLabel;
      if (selectedPort) {
        portLabel = nls.localize(
          'arduino/common/selectedOn',
          'on {0}',
          selectedPort.address
        );
        const selectedItem: BoardListItem | undefined =
          boardList.items[boardList.selectedIndex];
        if (!selectedItem) {
          portLabel += ` ${notConnectedLabel}`; // append ` [not connected]` when the port is selected but it's not detected by the CLI
        }
      }
      this.statusBar.setElement('arduino-selected-port', {
        alignment: StatusBarAlignment.RIGHT,
        text: portLabel,
        className: 'arduino-selected-port',
      });
    } else {
      this.statusBar.removeElement('arduino-selected-port');
    }
  }
}
