export namespace SerialPlotter {
  export type Config = {
    currentBaudrate: number;
    baudrates: number[];
    currentLineEnding: string;
    darkTheme: boolean;
    wsPort: number;
    generate?: boolean;
  };
  export namespace Protocol {
    export enum Command {
      PLOTTER_SET_BAUDRATE = 'PLOTTER_SET_BAUDRATE',
      PLOTTER_SET_LINE_ENDING = 'PLOTTER_SET_LINE_ENDING',
      PLOTTER_SEND_MESSAGE = 'PLOTTER_SEND_MESSAGE',
      MIDDLEWARE_CONFIG_CHANGED = 'MIDDLEWARE_CONFIG_CHANGED',
    }
    export type Message = {
      command: SerialPlotter.Protocol.Command;
      data?: any;
    };
  }
}
