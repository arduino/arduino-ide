export const PlotterPath = '/services/plotter-service';
export const PlotterService = Symbol('PlotterService');

export interface PlotterService {
  start(config: PlotterConfig | undefined): Promise<void>;
  stop(): Promise<void>;
  setOptions(config: PlotterConfig): Promise<void>;
}

export interface PlotterConfig {
  currentBaudrate: number;
  baudrates: number[];
  darkTheme: boolean;
  wsPort: number;
  generate?: boolean;
}
