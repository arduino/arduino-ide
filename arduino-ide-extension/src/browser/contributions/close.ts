import { injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  URI,
} from './contribution';
import { nls } from '@theia/core/lib/common';
import { Dialog } from '@theia/core/lib/browser/dialogs';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { SaveAsSketch } from './save-as-sketch';
import type { OnWillStopAction } from '@theia/core/lib/browser/frontend-application';

/**
 * Closes the `current` closeable editor, or any closeable current widget from the main area, or the current sketch window.
 */
@injectable()
export class Close extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Close.Commands.CLOSE, {
      execute: () => remote.getCurrentWindow().close(),
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: Close.Commands.CLOSE.id,
      label: nls.localize('vscode/editor.contribution/close', 'Close'),
      order: '5',
    });
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: Close.Commands.CLOSE.id,
      keybinding: 'CtrlCmd+W',
    });
  }

  // `FrontendApplicationContribution#onWillStop`
  onWillStop(): OnWillStopAction {
    return {
      reason: 'temp-sketch',
      action: () => {
        return this.showTempSketchDialog();
      },
    };
  }

  private async showTempSketchDialog(): Promise<boolean> {
    const sketch = await this.sketchServiceClient.currentSketch();
    if (!CurrentSketch.isValid(sketch)) {
      return true;
    }
    const isTemp = await this.sketchService.isTemp(sketch);
    if (!isTemp) {
      return true;
    }
    const messageBoxResult = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        message: nls.localize(
          'arduino/sketch/saveTempSketch',
          'Save your sketch to open it again later.'
        ),
        title: nls.localize(
          'theia/core/quitTitle',
          'Are you sure you want to quit?'
        ),
        type: 'question',
        buttons: [
          Dialog.CANCEL,
          nls.localizeByDefault('Save As...'),
          nls.localizeByDefault("Don't Save"),
        ],
      }
    );
    const result = messageBoxResult.response;
    if (result === 2) {
      return true;
    } else if (result === 1) {
      return !!(await this.commandService.executeCommand(
        SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
        {
          execOnlyIfTemp: false,
          openAfterMove: false,
          wipeOriginal: true,
        }
      ));
    }
    return false;
  }

  /**
   * If the file was ever touched/modified. We get this based on the `version` of the monaco model.
   */
  protected async wasTouched(uri: string): Promise<boolean> {
    const editorWidget = await this.editorManager.getByUri(new URI(uri));
    if (editorWidget) {
      const { editor } = editorWidget;
      if (editor instanceof MonacoEditor) {
        const versionId = editor.getControl().getModel()?.getVersionId();
        if (this.isInteger(versionId) && versionId > 1) {
          return true;
        }
      }
    }
    return false;
  }

  private isInteger(arg: unknown): arg is number {
    return Number.isInteger(arg);
  }
}

export namespace Close {
  export namespace Commands {
    export const CLOSE: Command = {
      id: 'arduino-close',
    };
  }
}
