import type {
  MessageBoxOptions as ElectronMessageBoxOptions,
  MessageBoxReturnValue as ElectronMessageBoxReturnValue,
  OpenDialogOptions as ElectronOpenDialogOptions,
  OpenDialogReturnValue as ElectronOpenDialogReturnValue,
  SaveDialogOptions as ElectronSaveDialogOptions,
  SaveDialogReturnValue as ElectronSaveDialogReturnValue,
} from '@theia/core/electron-shared/electron';
import type { Disposable } from '@theia/core/lib/common/disposable';
import type { Sketch } from '../common/protocol/sketches-service';
import type { StartupTasks } from './startup-task';

export type MessageBoxOptions = Omit<
  ElectronMessageBoxOptions,
  'icon' | 'signal'
>;
export type MessageBoxReturnValue = ElectronMessageBoxReturnValue;
export type OpenDialogOptions = ElectronOpenDialogOptions;
export type OpenDialogReturnValue = ElectronOpenDialogReturnValue;
export type SaveDialogOptions = ElectronSaveDialogOptions;
export type SaveDialogReturnValue = ElectronSaveDialogReturnValue;

export interface ShowPlotterWindowParams {
  readonly url: string;
  readonly forceReload?: boolean;
}
export function isShowPlotterWindowParams(
  arg: unknown
): arg is ShowPlotterWindowParams {
  return (
    typeof arg === 'object' &&
    typeof (<ShowPlotterWindowParams>arg).url === 'string' &&
    ((<ShowPlotterWindowParams>arg).forceReload === undefined ||
      typeof (<ShowPlotterWindowParams>arg).forceReload === 'boolean')
  );
}

export interface ElectronArduino {
  showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
  showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>;
  showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue>;
  appVersion(): Promise<string>;
  quitApp(): void;
  isFirstWindow(): Promise<boolean>;
  requestReload(tasks: StartupTasks): void;
  registerStartupTasksHandler(
    handler: (tasks: StartupTasks) => void
  ): Disposable;
  scheduleDeletion(sketch: Sketch): void;
  setRepresentedFilename(fsPath: string): void;
  showPlotterWindow(params: { url: string; forceReload?: boolean }): void;
  registerPlotterWindowCloseHandler(handler: () => void): Disposable;
}

declare global {
  interface Window {
    electronArduino: ElectronArduino;
  }
}

// renderer to main
export const CHANNEL_SHOW_MESSAGE_BOX = 'Arduino:ShowMessageBox';
export const CHANNEL_SHOW_OPEN_DIALOG = 'Arduino:ShowOpenDialog';
export const CHANNEL_SHOW_SAVE_DIALOG = 'Arduino:ShowSaveDialog';
export const CHANNEL_APP_VERSION = 'Arduino:AppVersion';
export const CHANNEL_QUIT_APP = 'Arduino:QuitApp';
export const CHANNEL_IS_FIRST_WINDOW = 'Arduino:IsFirstWindow';
export const CHANNEL_SCHEDULE_DELETION = 'Arduino:ScheduleDeletion';
export const CHANNEL_SET_REPRESENTED_FILENAME =
  'Arduino:SetRepresentedFilename';
export const CHANNEL_SHOW_PLOTTER_WINDOW = 'Arduino:ShowPlotterWindow';
// main to renderer
export const CHANNEL_SEND_STARTUP_TASKS = 'Arduino:SendStartupTasks';
export const CHANNEL_PLOTTER_WINDOW_DID_CLOSE = 'Arduino:PlotterWindowDidClose';
