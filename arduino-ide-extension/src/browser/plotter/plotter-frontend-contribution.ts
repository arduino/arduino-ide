import { injectable, inject } from 'inversify';
import {
  Command,
  CommandRegistry,
  MaybePromise,
  MenuModelRegistry,
} from '@theia/core';
import { MonitorModel } from '../monitor/monitor-model';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Contribution } from '../contributions/contribution';
import { PlotterService } from '../../common/protocol/plotter-service';
import { Endpoint, FrontendApplication } from '@theia/core/lib/browser';
import { ipcRenderer } from '@theia/core/shared/electron';
import { SerialPlotter } from './protocol';
import { MonitorConfig } from '../../common/protocol';
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
  protected initConfig: SerialPlotter.Config;

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  @inject(PlotterService)
  protected readonly plotter: PlotterService;

  onStart(app: FrontendApplication): MaybePromise<void> {
    this.url = new Endpoint({ path: '/plotter' }).getRestUrl().toString();

    this.initConfig = {
      baudrates: MonitorConfig.BaudRates.map((b) => b),
      currentBaudrate: this.model.baudRate,
      darkTheme: true,
      wsPort: 0,
      generate: true,
    };

    ipcRenderer.on('CLOSE_CHILD_WINDOW', () => {
      if (this.window) {
        if (!this.window.closed) this.window?.close();
        this.window = null;
      }
    });

    return super.onStart(app);
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotterContribution.Commands.OPEN, {
      execute: async () => this.open(),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: SerialPlotterContribution.Commands.OPEN.id,
      label: SerialPlotterContribution.Commands.OPEN.label,
      order: '7',
    });
  }

  protected async open(): Promise<void> {
    if (this.window) {
      this.window.focus();
    } else {
      const urlWithParams = queryString.stringifyUrl(
        {
          url: this.url,
          query: this.initConfig,
        },
        { arrayFormat: 'comma' }
      );
      this.window = window.open(urlWithParams, 'serialPlotter');
    }
  }
}
