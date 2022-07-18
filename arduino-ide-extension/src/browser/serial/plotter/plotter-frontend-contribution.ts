import { ThemeService } from '@theia/core/lib/browser/theming';
import { injectable, inject } from '@theia/core/shared/inversify';
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
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { MonitorModel } from '../../monitor-model';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';

const queryString = require('query-string');

export namespace SerialPlotterContribution {
  export namespace Commands {
    export const OPEN: Command = Command.toLocalizedCommand(
      {
        id: 'serial-plotter-open',
        label: 'Serial Plotter',
        category: 'Arduino',
      },
      'arduino/serial/openSerialPlotter'
    );

    export const RESET: Command = {
      id: 'serial-plotter-reset',
    };
    export const OPEN_TOOLBAR: Command = {
      id: 'serial-plotter-open-toolbar',
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

  override onStart(app: FrontendApplication): MaybePromise<void> {
    this.url = new Endpoint({ path: '/plotter' }).getRestUrl().toString();

    ipcRenderer.on('CLOSE_CHILD_WINDOW', async () => {
      if (!!this.window) {
        this.window = null;
      }
    });
    this.monitorManagerProxy.onMonitorShouldReset(() => this.reset());

    return super.onStart(app);
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotterContribution.Commands.OPEN, {
      execute: this.startPlotter.bind(this),
    });
    registry.registerCommand(SerialPlotterContribution.Commands.RESET, {
      execute: () => this.reset(),
    });
    registry.registerCommand(
      { id: SerialPlotterContribution.Commands.OPEN_TOOLBAR.id },
      {
        isVisible: (widget) =>
          ArduinoToolbar.is(widget) && widget.side === 'right',
        execute: this.startPlotter.bind(this),
      }
    );
  }

  override registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: SerialPlotterContribution.Commands.OPEN.id,
      label: SerialPlotterContribution.Commands.OPEN.label,
      order: '7',
    });
  }

  async startPlotter(): Promise<void> {
    await this.monitorManagerProxy.startMonitor();
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
    const initConfig = {
      darkTheme: this.themeService.getCurrentTheme().type === 'dark',
      wsPort,
      serialPort: this.model.serialPort,
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

  protected async reset(): Promise<void> {
    if (!!this.window) {
      this.window.close();
      await this.startPlotter();
    }
  }
}
