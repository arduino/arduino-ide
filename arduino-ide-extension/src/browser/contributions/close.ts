import { injectable } from '@theia/core/shared/inversify';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import type { MaybePromise } from '@theia/core/lib/common/types';
import type {
  FrontendApplication,
  OnWillStopAction,
} from '@theia/core/lib/browser/frontend-application';
import { nls } from '@theia/core/lib/common/nls';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { ArduinoMenus } from '../menu/arduino-menus';
import {
  SketchContribution,
  Command,
  CommandRegistry,
  MenuModelRegistry,
  KeybindingRegistry,
  Sketch,
  URI,
} from './contribution';
import { Dialog } from '@theia/core/lib/browser/dialogs';
import { CurrentSketch } from '../../common/protocol/sketches-service-client-impl';
import { SaveAsSketch } from './save-as-sketch';

/**
 * Closes the `current` closeable editor, or any closeable current widget from the main area, or the current sketch window.
 */
@injectable()
export class Close extends SketchContribution {
  private shell: ApplicationShell | undefined;

  override onStart(app: FrontendApplication): MaybePromise<void> {
    this.shell = app.shell;
  }

  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Close.Commands.CLOSE, {
      execute: () => {
        // Close current editor if closeable.
        const { currentEditor } = this.editorManager;
        if (currentEditor && currentEditor.title.closable) {
          currentEditor.close();
          return;
        }

        if (this.shell) {
          // Close current widget from the main area if possible.
          const { currentWidget } = this.shell;
          if (currentWidget) {
            const currentWidgetInMain = toArray(
              this.shell.mainPanel.widgets()
            ).find((widget) => widget === currentWidget);
            if (currentWidgetInMain && currentWidgetInMain.title.closable) {
              return currentWidgetInMain.close();
            }
          }
        }
        return remote.getCurrentWindow().close();
      },
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
      reason: 'save-sketch',
      action: () => {
        return this.showSaveSketchDialog();
      },
    };
  }

  /**
   * If returns with `true`, IDE2 will close. Otherwise, it won't.
   */
  private async showSaveSketchDialog(): Promise<boolean> {
    const sketch = await this.isCurrentSketchTemp();
    if (!sketch) {
      // Normal close workflow: if there are dirty editors prompt the user.
      if (!this.shell) {
        console.error(
          `Could not get the application shell. Something went wrong.`
        );
        return true;
      }
      if (this.shell.canSaveAll()) {
        const prompt = await this.prompt(false);
        switch (prompt) {
          case Prompt.DoNotSave:
            return true;
          case Prompt.Cancel:
            return false;
          case Prompt.Save: {
            await this.shell.saveAll();
            return true;
          }
          default:
            throw new Error(`Unexpected prompt: ${prompt}`);
        }
      }
      return true;
    }

    // If non of the sketch files were ever touched, do not prompt the save dialog. (#1274)
    const wereTouched = await Promise.all(
      Sketch.uris(sketch).map((uri) => this.wasTouched(uri))
    );
    if (wereTouched.every((wasTouched) => !Boolean(wasTouched))) {
      return true;
    }

    const prompt = await this.prompt(true);
    switch (prompt) {
      case Prompt.DoNotSave:
        return true;
      case Prompt.Cancel:
        return false;
      case Prompt.Save: {
        // If `save as` was canceled by user, the result will be `undefined`, otherwise the new URI.
        const result = await this.commandService.executeCommand(
          SaveAsSketch.Commands.SAVE_AS_SKETCH.id,
          {
            execOnlyIfTemp: false,
            openAfterMove: false,
            wipeOriginal: true,
            markAsRecentlyOpened: true,
          }
        );
        return !!result;
      }
      default:
        throw new Error(`Unexpected prompt: ${prompt}`);
    }
  }

  private async prompt(isTemp: boolean): Promise<Prompt> {
    const { response } = await remote.dialog.showMessageBox(
      remote.getCurrentWindow(),
      {
        message: nls.localize(
          'arduino/sketch/saveSketch',
          'Save your sketch to open it again later.'
        ),
        title: nls.localize(
          'theia/core/quitTitle',
          'Are you sure you want to quit?'
        ),
        type: 'question',
        buttons: [
          nls.localizeByDefault("Don't Save"),
          Dialog.CANCEL,
          nls.localizeByDefault(isTemp ? 'Save As...' : 'Save'),
        ],
        defaultId: 2, // `Save`/`Save As...` button index is the default.
      }
    );
    switch (response) {
      case 0:
        return Prompt.DoNotSave;
      case 1:
        return Prompt.Cancel;
      case 2:
        return Prompt.Save;
      default:
        throw new Error(`Unexpected response: ${response}`);
    }
  }

  private async isCurrentSketchTemp(): Promise<false | Sketch> {
    const currentSketch = await this.sketchServiceClient.currentSketch();
    if (CurrentSketch.isValid(currentSketch)) {
      const isTemp = await this.sketchService.isTemp(currentSketch);
      if (isTemp) {
        return currentSketch;
      }
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

enum Prompt {
  Save,
  DoNotSave,
  Cancel,
}

export namespace Close {
  export namespace Commands {
    export const CLOSE: Command = {
      id: 'arduino-close',
    };
  }
}
