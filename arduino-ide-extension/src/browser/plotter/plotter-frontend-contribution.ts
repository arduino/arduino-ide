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
import { MonitorConfig } from '../../common/protocol';
import { PlotterConnection } from './plotter-connection';
import { SerialPlotter } from './protocol';
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

  @inject(PlotterConnection)
  protected readonly plotterConnection: PlotterConnection;

  onStart(app: FrontendApplication): MaybePromise<void> {
    this.url = new Endpoint({ path: '/plotter' }).getRestUrl().toString();

    ipcRenderer.on('CLOSE_CHILD_WINDOW', () => {
      if (this.window) {
        if (!this.window.closed) this.window?.close();
        this.window = null;
        this.plotterConnection.autoConnect = false;
      }
    });

    this.toDispose.pushAll([
      this.plotterConnection.onWebSocketChanged((wsPort) => {
        this.open(wsPort);
      }),
    ]);

    return super.onStart(app);
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotterContribution.Commands.OPEN, {
      execute: async () => (this.plotterConnection.autoConnect = true),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: SerialPlotterContribution.Commands.OPEN.id,
      label: SerialPlotterContribution.Commands.OPEN.label,
      order: '7',
    });
  }

  protected async open(wsPort: string): Promise<void> {
    const initConfig: SerialPlotter.Config = {
      baudrates: MonitorConfig.BaudRates.map((b) => b),
      currentBaudrate: this.model.baudRate,
      darkTheme: true,
      wsPort: parseInt(wsPort, 10),
    };
    if (this.window) {
      this.window.focus();
    } else {
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
}
