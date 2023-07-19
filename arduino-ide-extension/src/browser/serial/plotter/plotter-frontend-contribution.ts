import { Endpoint } from '@theia/core/lib/browser/endpoint';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import type { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import queryString from 'query-string';
import { MonitorManagerProxyClient } from '../../../common/protocol';
import { Contribution } from '../../contributions/contribution';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { MonitorModel } from '../../monitor-model';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';

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
  private readonly endpointUrl = new Endpoint({ path: '/plotter' })
    .getRestUrl()
    .toString();
  private readonly toDispose = new DisposableCollection();
  private _plotterUrl: string | undefined;

  @inject(MonitorModel)
  private readonly model: MonitorModel;
  @inject(ThemeService)
  private readonly themeService: ThemeService;
  @inject(MonitorManagerProxyClient)
  private readonly monitorManagerProxy: MonitorManagerProxyClient;

  override onStart(): void {
    this.toDispose.push(
      window.electronArduino.registerPlotterWindowCloseHandler(() => {
        this._plotterUrl = undefined;
      })
    );
    this.monitorManagerProxy.onMonitorShouldReset(() => this.reset());
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotterContribution.Commands.OPEN, {
      execute: () => this.startPlotter(),
    });
    registry.registerCommand(SerialPlotterContribution.Commands.RESET, {
      execute: () => this.reset(),
    });
    registry.registerCommand(
      { id: SerialPlotterContribution.Commands.OPEN_TOOLBAR.id },
      {
        isVisible: (widget) =>
          ArduinoToolbar.is(widget) && widget.side === 'right',
        execute: () => this.startPlotter(),
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

  private async startPlotter(forceReload = false): Promise<void> {
    await this.monitorManagerProxy.startMonitor();
    if (this._plotterUrl) {
      window.electronArduino.showPlotterWindow({
        url: this._plotterUrl,
        forceReload,
      });
      return;
    }
    const wsPort = this.monitorManagerProxy.getWebSocketPort();
    if (wsPort) {
      this.open(wsPort);
    } else {
      this.messageService.error(
        nls.localize(
          'arduino/contributions/plotter/couldNotOpen',
          "Couldn't open serial plotter"
        )
      );
    }
  }

  private open(wsPort: number): void {
    const initConfig = {
      darkTheme: this.isDarkTheme,
      wsPort,
      serialPort: this.model.serialPort,
    };
    this._plotterUrl = queryString.stringifyUrl(
      {
        url: this.endpointUrl,
        query: initConfig,
      },
      { arrayFormat: 'comma' }
    );
    window.electronArduino.showPlotterWindow({ url: this._plotterUrl });
  }

  private get isDarkTheme(): boolean {
    const themeType = this.themeService.getCurrentTheme().type;
    return themeType === 'dark' || themeType === 'hc';
  }

  private async reset(): Promise<void> {
    if (this._plotterUrl) {
      await this.startPlotter(true);
    }
  }
}
