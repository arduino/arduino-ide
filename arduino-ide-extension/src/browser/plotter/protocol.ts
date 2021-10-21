export namespace SerialPlotter {
  export type Config = {
    currentBaudrate: number;
    baudrates: number[];
    darkTheme: boolean;
    wsPort: number;
    generate?: boolean;
  };
  export namespace Protocol {
    export enum Command {
      PLOTTER_REQUEST_CONFIG = 'PLOTTER_REQUEST_CONFIG',
      PLOTTER_READY = 'PLOTTER_READY',
      PLOTTER_SET_BAUDRATE = 'PLOTTER_SET_BAUDRATE',
      PLOTTER_SET_LINE_ENDING = 'PLOTTER_SET_LINE_ENDING',
      PLOTTER_SEND_MESSAGE = 'PLOTTER_SEND_MESSAGE',
      PARENT_SET_CONFIG = 'PARENT_SET_CONFIG',
    }
    export type Message = {
      command: SerialPlotter.Protocol.Command;
      data?: any;
    };
  }
}
