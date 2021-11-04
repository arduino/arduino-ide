import { ThemeService } from '@theia/core/lib/browser/theming';
import { injectable, inject } from 'inversify';
import {
  Command,
  CommandRegistry,
  DisposableCollection,
  MaybePromise,
  MenuModelRegistry,
} from '@theia/core';
import { MonitorModel } from '../monitor/monitor-model';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Contribution } from '../contributions/contribution';
import { Endpoint, FrontendApplication } from '@theia/core/lib/browser';
import { ipcRenderer } from '@theia/core/shared/electron';
import { MonitorConfig, Status } from '../../common/protocol';
import { Serial, SerialConnectionManager } from '../monitor/monitor-connection';
import { SerialPlotter } from './protocol';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
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
  protected toDispose = new DisposableCollection();

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  @inject(ThemeService)
  protected readonly themeService: ThemeService;

  @inject(SerialConnectionManager)
  protected readonly monitorConnection: SerialConnectionManager;

  @inject(BoardsServiceProvider)
  protected readonly boardsServiceProvider: BoardsServiceProvider;

  onStart(app: FrontendApplication): MaybePromise<void> {
    this.url = new Endpoint({ path: '/plotter' }).getRestUrl().toString();

    ipcRenderer.on('CLOSE_CHILD_WINDOW', async () => {
      if (this.window) {
        this.window = null;
        await this.monitorConnection.closeSerial(Serial.Type.Plotter);
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
    if (this.monitorConnection.connected) {
      if (this.window) {
        this.window.focus();
        return;
      }
    }
    const status = await this.monitorConnection.openSerial(Serial.Type.Plotter);
    const wsPort = this.monitorConnection.getWsPort();
    if (Status.isOK(status) && wsPort) {
      this.open(wsPort);
    } else {
      this.messageService.error(`Couldn't open serial plotter`);
    }
  }

  protected open(wsPort: number): void {
    const initConfig: SerialPlotter.Config = {
      baudrates: MonitorConfig.BaudRates.map((b) => b),
      currentBaudrate: this.model.baudRate,
      currentLineEnding: this.model.lineEnding,
      darkTheme: this.themeService.getCurrentTheme().type === 'dark',
      wsPort,
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
