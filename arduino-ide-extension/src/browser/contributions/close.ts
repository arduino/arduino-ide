import { inject, injectable } from '@theia/core/shared/inversify';
import * as remote from '@theia/core/electron-shared/@electron/remote';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
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

/**
 * Closes the `current` closeable editor, or any closeable current widget from the main area, or the current sketch window.
 */
@injectable()
export class Close extends SketchContribution {
  @inject(EditorManager)
  protected readonly editorManager: EditorManager;

  protected shell: ApplicationShell;

  onStart(app: FrontendApplication): void {
    this.shell = app.shell;
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(Close.Commands.CLOSE, {
      execute: () => remote.getCurrentWindow().close()
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
      commandId: Close.Commands.CLOSE.id,
      label: nls.localize('vscode/editor.contribution/close', 'Close'),
      order: '5',
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: Close.Commands.CLOSE.id,
      keybinding: 'CtrlCmd+W',
    });
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
        if (Number.isInteger(versionId) && versionId! > 1) {
          return true;
        }
      }
    }
    return false;
  }
}

export namespace Close {
  export namespace Commands {
    export const CLOSE: Command = {
      id: 'arduino-close',
    };
  }
}
