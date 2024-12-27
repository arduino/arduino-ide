import type {
  FrontendApplication,
  OnWillStopAction,
} from '@theia/core/lib/browser/frontend-application';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { nls } from '@theia/core/lib/common/nls';
import type { MaybePromise } from '@theia/core/lib/common/types';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import { inject, injectable } from '@theia/core/shared/inversify';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { CurrentSketch } from '../sketches-service-client-impl';
import { WindowServiceExt } from '../theia/core/window-service-ext';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  Sketch,
  SketchContribution,
  URI,
} from './contribution';
import { SaveAsSketch } from './save-as-sketch';
import { Dialog } from '../theia/dialogs/theiaDialogs/dialogs';

/**
 * Closes the `current` closeable editor, or any closeable current widget from the main area, or the current sketch window.
 */
@injectable()
export class Close extends SketchContribution {
  @inject(WindowServiceExt)
  private readonly windowServiceExt: WindowServiceExt;

  private shell: ApplicationShell | undefined;

  override onStart(app: FrontendApplication): MaybePromise<void> {
    this.shell = app.shell;
  }

  override registerCommands(registry: CommandRegistry): void {
    // 注册关闭命令
    registry.registerCommand(Close.Commands.CLOSE, {
      // 执行关闭命令的函数
      execute: () => {
        // 尝试关闭当前可关闭的编辑器
        const { currentEditor } = this.editorManager;
        if (currentEditor && currentEditor.title.closable) {
          currentEditor.close();
          return;
        }

        if (this.shell) {
          // 获取当前主区域的小部件，如果有可关闭的小部件则关闭它
          const { currentWidget } = this.shell;
          if (currentWidget) {
            const currentWidgetInMain = toArray(
              this.shell.mainPanel.widgets()
            ).find((widget) => widget === currentWidget);
            if (currentWidgetInMain) {
              return currentWidgetInMain.close();
            }
          }
        }
        // 如果没有可关闭的编辑器或小部件，则关闭窗口
        return this.windowServiceExt.close();
      },
    });
  }

  // override registerMenus(registry: MenuModelRegistry): void {
  //   registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
  //     commandId: Close.Commands.CLOSE.id,
  //     label: nls.localize('vscode/editor.contribution/close', 'Close'),
  //     order: '6',
  //   });
  // }

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
   * 如果返回' true '， IDE2将关闭。否则，它不会.
   */
  private async showSaveSketchDialog(): Promise<boolean> {
    // 检查当前的草图是否为临时草图，如果不是临时草图，则返回 false，表示无需进行保存草图的对话框展示。
    const sketch = await this.isCurrentSketchTemp();
    if (!sketch) {
      // 如果无法获取应用的外壳（shell），则记录错误信息并返回 true，可能表示进行默认的关闭流程。
      if (!this.shell) {
        console.error(
          `Could not get the application shell. Something went wrong.`
        );
        return true;
      }
      // 如果应用的外壳可以保存所有内容（可能表示有未保存的编辑器等）
      if (this.shell.canSaveAll()) {
        // 显示提示对话框并等待用户的响应
        const prompt = await this.prompt(false);
        // 根据用户的响应进行不同的操作
        switch (prompt) {
          case Prompt.DoNotSave:
            // 用户选择不保存，直接返回 true，表示可以继续关闭流程
            return true;
          case Prompt.Cancel:
            // 用户选择取消，返回 false，表示不继续关闭流程
            return false;
          case Prompt.Save: {
            // 用户选择保存，调用应用外壳的保存所有方法，并返回 true，表示可以继续关闭流程
            await this.shell.saveAll();
            return true;
          }
          default:
            // 如果出现意外的提示响应，抛出错误
            throw new Error(`Unexpected prompt: ${prompt}`);
        }
      }
      // 如果应用外壳不能保存所有内容，直接返回 true，表示进行默认的关闭流程
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
    const { response } = await this.dialogService.showMessageBox({
      message: '保存您的草图，以便稍后再次打开它。',
      title: '你确定要退出吗？',
      type: 'question',
      buttons: [
        nls.localizeByDefault('不保存'),
        Dialog.CANCEL,
        nls.localizeByDefault(isTemp ? '保存于...' : '保存'),
      ],
      defaultId: 2, // `Save`/`Save As...` button index is the default.
    });
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
    // 获取当前的草图对象
    const currentSketch = await this.sketchServiceClient.currentSketch();
    if (CurrentSketch.isValid(currentSketch)) {
      // 检查当前草图是否为临时草图
      const isTemp = await this.sketchesService.isTemp(currentSketch);
      if (isTemp) {
        // 如果是临时草图，返回当前草图对象
        return currentSketch;
      }
    }
    // 如果不是临时草图或者当前草图无效，返回 false
    return false;
  }

  /**
   * If the file was ever touched/modified. We get this based on the `version` of the monaco model.
   */
  protected async wasTouched(uri: string): Promise<boolean> {
    // 根据给定的 URI 获取对应的编辑器小部件（editorWidget）
    const editorWidget = await this.editorManager.getByUri(new URI(uri));
    if (editorWidget) {
      // 解构获取编辑器实例（editor）
      const { editor } = editorWidget;
      // 如果编辑器是 MonacoEditor 类型
      if (editor instanceof MonacoEditor) {
        // 获取编辑器模型的版本 ID
        const versionId = editor.getControl().getModel()?.getVersionId();
        // 如果版本 ID 是整数且大于 1，表示编辑器内容有过修改（被触碰过）
        if (this.isInteger(versionId) && versionId > 1) {
          return true;
        }
      }
    }
    // 如果没有满足上述条件，返回 false，表示未被触碰过
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
      id: 'lingzhi-close',
    };
  }
}
