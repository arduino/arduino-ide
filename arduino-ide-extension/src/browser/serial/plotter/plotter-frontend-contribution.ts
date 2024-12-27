import { Endpoint } from '@theia/core/lib/browser/endpoint';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { Command, CommandRegistry } from '@theia/core/lib/common/command';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import type { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { inject, injectable } from '@theia/core/shared/inversify';
import queryString from 'query-string';
import {
  MonitorManagerProxyClient,
  ResponseService,
} from '../../../common/protocol';
import { Contribution } from '../../contributions/contribution';
import { ArduinoMenus } from '../../menu/arduino-menus';
import { MonitorModel } from '../../monitor-model';
import { ArduinoToolbar } from '../../toolbar/arduino-toolbar';

export namespace SerialPlotterContribution {
  export namespace Commands {
    export const OPEN: Command = Command.toLocalizedCommand({
      id: 'serial-plotter-open',
      label: '串口绘图仪',
      category: 'LingZhi',
    });

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
  @inject(ResponseService)
  private readonly responseService: ResponseService;

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
        isVisible: (widget, showToolbar: boolean) =>
          showToolbar && ArduinoToolbar.is(widget) && widget.side === 'right',
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

  // 定义一个异步方法startPlotter，用于启动绘图器
  private async startPlotter(forceReload = false): Promise<void> {
    // 调用monitorManagerProxy的startMonitor方法
    await this.monitorManagerProxy.startMonitor();
    // 如果_plotterUrl存在
    if (this._plotterUrl) {
      // 调用window.electronArduino的showPlotterWindow方法，显示绘图器窗口
      window.electronArduino.showPlotterWindow({
        url: this._plotterUrl,
        forceReload,
      });
      return;
    }
    // 获取WebSocket端口
    const wsPort = this.monitorManagerProxy.getWebSocketPort();
    // 如果WebSocket端口存在
    if (wsPort) {
      // 调用open方法，打开WebSocket端口
      this.open(wsPort);
    } else {
      // 否则，调用messageService的error方法，显示错误信息
      // this.messageService.error(
      //   nls.localize(
      //     'arduino/contributions/plotter/couldNotOpen',
      //     '无法打开串行绘图仪'
      //   )
      // );
      const chunk = '无法打开串行绘图仪\n';
      this.responseService.appendToOutput({ chunk });
    }
  }

  private open(wsPort: number): void {
    // 创建初始化配置对象
    const initConfig = {
      darkTheme: this.isDarkTheme,
      wsPort,
      serialPort: this.model.serialPort,
    };
    // 将初始化配置对象转换为URL查询字符串
    this._plotterUrl = queryString.stringifyUrl(
      {
        url: this.endpointUrl,
        query: initConfig,
      },
      { arrayFormat: 'comma' }
    );
    // 显示绘图窗口，并传入URL
    window.electronArduino.showPlotterWindow({ url: this._plotterUrl });
  }

  private get isDarkTheme(): boolean {
    const themeType = this.themeService.getCurrentTheme().type;
    return themeType === 'dark' || themeType === 'hc';
  }

  // 定义一个异步的reset方法，返回一个Promise<void>
  private async reset(): Promise<void> {
    // 如果_plotterUrl存在
    if (this._plotterUrl) {
      // 调用startPlotter方法，传入true参数
      await this.startPlotter(true);
    }
  }
}
