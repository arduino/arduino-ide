import { injectable } from '@theia/core/shared/inversify';
import type { DialogService } from '../browser/dialog-service';
import type {
  MessageBoxOptions,
  MessageBoxReturnValue,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from '../electron-common/electron-arduino';

@injectable()
export class ElectronDialogService implements DialogService {
  showMessageBox(options: MessageBoxOptions): Promise<MessageBoxReturnValue> {
    return window.electronArduino.showMessageBox(options);
  }

  showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
    return window.electronArduino.showOpenDialog(options);
  }

  showSaveDialog(options: SaveDialogOptions): Promise<SaveDialogReturnValue> {
    return window.electronArduino.showSaveDialog(options);
  }
}
