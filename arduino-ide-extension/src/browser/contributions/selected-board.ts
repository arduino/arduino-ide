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
import { WindowService } from '@theia/core/lib/browser/window/window-service';

@injectable()
export class SelectedBoard extends Contribution {
  @inject(StatusBar)
  private readonly statusBar: StatusBar;
  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;
  @inject(WindowService)
  protected readonly windowService: WindowService;

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
    function name(fqbn: string | undefined, name: string): string {
      if (!fqbn) {
        return '';
      }
      const lastColonIndex = fqbn.lastIndexOf(':');
      const valueAfterLastColon = fqbn.slice(lastColonIndex + 1);
      switch (valueAfterLastColon) {
        case 'lzesp32':
          return '零知-ESP32';
        case 'lzesp8266':
          return '零知-ESP8266';
        case 'lingzhistandard':
          return '零知-标准板';
        case 'lingzhiMini':
          return '零知-迷你板';
        case 'lingzhiM4':
          return '零知-增强板';
        case 'lz_ble52':
          return '零知-BLE52';
        default:
          return name;
      }
    }
    this.statusBar.setElement('arduino-selected-board', {
      alignment: StatusBarAlignment.LEFT,
      text:
        '型号:' +
        (selectedBoard
          ? `$(microchip) ${name(selectedBoard.fqbn, selectedBoard.name)}`
          : `$(close) ${nls.localize(
            'arduino/common/noBoardSelected',
            'No board selected'
          )}`),
      className: 'arduino-selected-board',
    });
    if (selectedBoard) {
      const notConnectedLabel = nls.localize(
        'arduino/common/notConnected',
        '串口：[未连接]'
      );
      let portLabel = notConnectedLabel;
      if (selectedPort) {
        portLabel = `在${selectedPort.address}上`;
        const selectedItem: BoardListItem | undefined =
          boardList.items[boardList.selectedIndex];
        if (!selectedItem) {
          portLabel += ` ${notConnectedLabel}`; // append ` [not connected]` when the port is selected but it's not detected by the CLI
        }
      }
      this.statusBar.setElement('arduino-selected-port', {
        alignment: StatusBarAlignment.LEFT,
        text: portLabel,
        className: 'arduino-selected-port',
      });
    } else {
      this.statusBar.removeElement('arduino-selected-port');
    }
    this.statusBar.setElement('lingzhi-common-problem', {
      alignment: StatusBarAlignment.RIGHT,
      text: '常见问题',
      className: 'lingzhi-common-problem',
      onclick: () => {
        this.windowService.openNewWindow(
          'http://www.lingzhilab.com/lzbbs/resources.html?ecid=206',
          { external: true }
        );
      },
    });
    this.statusBar.setElement('lingzhi-official-website', {
      alignment: StatusBarAlignment.RIGHT,
      text: '官网: www.lingzhilab.com',
      color: '#ff0000',
      className: 'lingzhi-official-website',
      onclick: () => {
        this.windowService.openNewWindow('https://www.lingzhilab.com/', {
          external: true,
        });
      },
    });
  }
}
