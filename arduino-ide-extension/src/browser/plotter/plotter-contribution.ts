import { injectable, inject } from 'inversify';
import { Command, CommandRegistry, MenuModelRegistry } from '@theia/core';
import { MonitorModel } from '../monitor/monitor-model';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Contribution } from '../contributions/contribution';
import { MonitorConfig } from '../../common/protocol';

export namespace SerialPlotter {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'serial-plotter-open',
      label: 'Serial Plotter',
      category: 'Arduino',
    };
  }
  export type InitMessage = {
    baudrate: MonitorConfig.BaudRate;
    darkTheme: boolean;
    wsPort: number;
  };
}

@injectable()
export class PlotterContribution extends Contribution {
  protected window: Window | null;

  @inject(MonitorModel)
  protected readonly model: MonitorModel;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(SerialPlotter.Commands.OPEN, {
      execute: async () => this.open(),
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(ArduinoMenus.TOOLS__MAIN_GROUP, {
      commandId: SerialPlotter.Commands.OPEN.id,
      label: SerialPlotter.Commands.OPEN.label,
      order: '7',
    });
  }

  protected async open(): Promise<void> {
    const url = 'http://localhost:8080/index.html';
    if (this.window) {
      this.window.focus();
    } else {
      this.window = window.open(url, 'serialPlotter');
      window.addEventListener('message', handlePostMessage);
      const initMessage: SerialPlotter.InitMessage = {
        baudrate: this.model.baudRate,
        darkTheme: false,
        wsPort: 0,
      };
      if (this.window) {
        this.window.postMessage(initMessage, url);
        this.window.onclose = () => {
          window.removeEventListener('message', handlePostMessage);
          this.window = null;
        };
      }
    }
  }
}

const handlePostMessage = (event: MessageEvent) => {
  console.log(event.data);
};
