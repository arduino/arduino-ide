import { ThemeService } from '@theia/core/lib/browser/theming';
import { injectable, inject } from 'inversify';
import {
  Command,
  CommandRegistry,
  MaybePromise,
  MenuModelRegistry,
} from '@theia/core';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { Contribution } from '../../contributions/contribution';
import { Endpoint, FrontendApplication } from '@theia/core/lib/browser';
import { ipcRenderer } from '@theia/electron/shared/electron';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { SerialPlotter } from './protocol';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { MonitorModel } from '../../monitor-model';
const queryString = require('query-string');

export namespace SerialPlotterContribution {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'serial-plotter-open',
      label: 'Serial Plotter',
      category: 'Arduino',
    };
  }
}

@injectable()
export class PlotterFrontendContribution extends Contribution {
  protected window: Window | null;
  protected url: string;
  protected wsPort: number;

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  @inject(ThemeService)
  protected readonly themeService: ThemeService;

  @inject(MonitorManagerProxyClient)
  protected readonly monitorManagerProxy: MonitorManagerProxyClient;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  onStart(app: FrontendApplication): MaybePromise<void> {
    this.url = new Endpoint({ path: '/plotter' }).getRestUrl().toString();

    ipcRenderer.on('CLOSE_CHILD_WINDOW', async () => {
      if (!!this.window) {
        this.window = null;
      }
    });
    return super.onStart(app);
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotterContribution.Commands.OPEN, {
      execute: this.connect.bind(this),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: SerialPlotterContribution.Commands.OPEN.id,
      label: SerialPlotterContribution.Commands.OPEN.label,
      order: '7',
    });
  }

  async connect(): Promise<void> {
    if (!!this.window) {
      this.window.focus();
      return;
    }
    const wsPort = this.monitorManagerProxy.getWebSocketPort();
    if (wsPort) {
      this.open(wsPort);
    } else {
      this.messageService.error(`Couldn't open serial plotter`);
    }
  }

  protected async open(wsPort: number): Promise<void> {
    const board = this.boardsServiceProvider.boardsConfig.selectedBoard;
    const port = this.boardsServiceProvider.boardsConfig.selectedPort;
    let baudrates: number[] = [];
    let currentBaudrate = -1;
    if (board && port) {
      const settings = this.monitorManagerProxy.getCurrentSettings(board, port);
      if ('baudrate' in settings) {
        // Convert from string to numbers
        baudrates = settings['baudrate'].values.map(b => +b);
        currentBaudrate = +settings['baudrate'].selectedValue;
      }
    }

    const initConfig: Partial<SerialPlotter.Config> = {
      baudrates,
      currentBaudrate,
      currentLineEnding: this.model.lineEnding,
      darkTheme: this.themeService.getCurrentTheme().type === 'dark',
      wsPort,
      interpolate: this.model.interpolate,
      connected: await this.monitorManagerProxy.isWSConnected(),
      serialPort: this.boardsServiceProvider.boardsConfig.selectedPort?.address,
    };
    const urlWithParams = queryString.stringifyUrl(
      {
        url: this.url,
        query: initConfig,
      },
      { arrayFormat: 'comma' }
    );
    this.window = window.open(urlWithParams, 'serialPlotter');
  }
}
