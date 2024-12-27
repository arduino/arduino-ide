import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import {
  ResponseService,
  SketchesError,
  SketchesService,
  SketchRef,
} from '../../common/protocol';
import {
  Command,
  CommandRegistry,
  KeybindingRegistry,
  Sketch,
  SketchContribution,
  URI,
} from './contribution';
import { DialogService } from '../dialog-service';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { WorkspaceInput } from '@theia/workspace/lib/browser';
import { OpenSketchFiles } from './open-sketch-files';
import {
  MAIN_WIDGET_CLOSE_AND_OPEN,
  MyWidgetCommandHome,
} from '../boardImg/boardImg-widget-contribution';
import { LINGZHI_OPEN_SKETCHBOOK_WIDGET } from '../widgets/sketchbook/sketchbook-widget-contribution';

export type SketchLocation = string | URI | SketchRef;
export namespace SketchLocation {
  export function toUri(location: SketchLocation): URI {
    if (typeof location === 'string') {
      return new URI(location);
    } else if (SketchRef.is(location)) {
      return toUri(location.uri);
    } else {
      return location;
    }
  }
  export function is(arg: unknown): arg is SketchLocation {
    return typeof arg === 'string' || arg instanceof URI || SketchRef.is(arg);
  }
}

@injectable()
export class OpenSketch extends SketchContribution {
  @inject(WorkspaceService)
  protected readonly workspaceService1: WorkspaceService;
  @inject(ResponseService)
  private readonly responseService: ResponseService;

  override registerCommands(registry: CommandRegistry): void {
    // 注册 OpenSketch.Commands.OPEN_SKETCH 命令
    registry.registerCommand(OpenSketch.Commands.OPEN_SKETCH, {
      // 定义命令的执行逻辑
      execute: async (arg, uri) => {
        // 如果参数不是 SketchLocation 类型，则调用 selectSketch 方法获取要打开的草图位置
        let toOpen = !SketchLocation.is(arg) ? await this.selectSketch() : arg;
        if (toOpen || uri) {
          if (!uri) {
            uri = (toOpen as Sketch).uri;
          }
          const today = new Date();
          localStorage.setItem(
            'arduino-new-sketch-executedB',
            today.toLocaleString()
          );
          localStorage.setItem(
            'lingzhi-open-sketch-view',
            today.toLocaleString()
          );
          // 如果有可打开的草图位置，则调用 openSketch 方法打开草图
          const stat = await this.toFileStat(uri);
          await this.workspaceService1.reloadSetWorkspace(stat);
          await this.sketchServiceClient.init(true);

          this.commandService.executeCommand(MyWidgetCommandHome.id);
          this.commandService.executeCommand(
            MAIN_WIDGET_CLOSE_AND_OPEN.id,
            uri
          );
          this.commandService.executeCommand(LINGZHI_OPEN_SKETCHBOOK_WIDGET.id);

          this.workspaceService.roots.then(async (roots) => {
            for (const root of roots) {
              await this.commandService.executeCommand(
                OpenSketchFiles.Commands.OPEN_SKETCH_FILES.id,
                root.resource,
                true
              );
              this.sketchesService.markAsRecentlyOpened(
                root.resource.toString()
              ); // no await, will get the notification later and rebuild the menu
            }
          });
          // 重新加载窗口以及工作区
          return this.openSketch(toOpen);
        }
      },
    });
  }

  // override registerMenus(registry: MenuModelRegistry): void {
  //   registry.registerMenuAction(ArduinoMenus.FILE__SKETCH_GROUP, {
  //     commandId: OpenSketch.Commands.OPEN_SKETCH.id,
  //     label: '打开...',
  //     order: '2',
  //   });
  // }

  override registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding({
      command: OpenSketch.Commands.OPEN_SKETCH.id,
      keybinding: 'CtrlCmd+O',
    });
  }

  private async openSketch(toOpen: SketchLocation | undefined): Promise<void> {
    // 如果没有要打开的草图位置，则直接返回
    if (!toOpen) {
      return;
    }
    // 将草图位置转换为 URI
    const uri = SketchLocation.toUri(toOpen);
    try {
      // 调用 sketchesService 的 loadSketch 方法加载草图
      await this.sketchesService.loadSketch(uri.toString());
    } catch (err) {
      // 如果错误是因为草图未找到
      if (SketchesError.NotFound.is(err)) {
        // 显示错误消息
        // this.messageService.error(err.message);
        const chunk = `${err.message}`;
        this.responseService.appendToOutput({ chunk });
      }
      // 重新抛出错误
      throw err;
    }

    // 调用 workspaceService 的 open 方法打开草图
    // const stat = await this.toFileStat(uri);
    // this.workspaceService1.reloadSetWorkspace(stat);
    const preserveWindow: WorkspaceInput = { preserveWindow: true };
    this.workspaceService.open(uri, preserveWindow);
  }

  /**
   * 如果参数URI指向文件或目录，则返回FileStat。否则, `undefined`.
   */
  protected async toFileStat(
    uri: URI | string | undefined
  ): Promise<FileStat | undefined> {
    // 如果传入的 URI 为 undefined，则直接返回 undefined
    if (!uri) {
      return undefined;
    }
    let uriStr = uri.toString();
    try {
      // 如果 URI 以 '/' 结尾，去除末尾的 '/'
      if (uriStr.endsWith('/')) {
        uriStr = uriStr.slice(0, -1);
      }
      // 创建标准化路径的 URI 对象
      const normalizedUri = new URI(uriStr).normalizePath();
      // 通过文件服务解析该 URI，获取文件状态信息
      return await this.fileService.resolve(normalizedUri);
    } catch (error) {
      // 如果出现错误，返回 undefined
      return undefined;
    }
  }

  private async selectSketch(): Promise<Sketch | undefined> {
    const defaultPath = await this.defaultPath();
    const { filePaths } = await this.dialogService.showOpenDialog({
      defaultPath,
      properties: ['createDirectory', 'openFile'],
      filters: [
        {
          name: '草图',
          extensions: ['ino', 'pde'],
        },
      ],
    });
    if (!filePaths.length) {
      return undefined;
    }
    if (filePaths.length > 1) {
      this.logger.warn(`多个草图被选中： ${filePaths}. 用第一个。`);
    }
    const sketchFilePath = filePaths[0];
    const sketchFileUri = await this.fileSystemExt.getUri(sketchFilePath);
    const sketch = await this.sketchesService.getSketchFolder(sketchFileUri);
    if (sketch) {
      return sketch;
    }
    if (Sketch.isSketchFile(sketchFileUri)) {
      return promptMoveSketch(sketchFileUri, {
        fileService: this.fileService,
        sketchesService: this.sketchesService,
        labelProvider: this.labelProvider,
        dialogService: this.dialogService,
      });
    }
  }
}

export namespace OpenSketch {
  export namespace Commands {
    export const OPEN_SKETCH: Command = {
      id: 'lingzhi-open-sketch',
    };
  }
}

export async function promptMoveSketch(
  sketchFileUri: string | URI,
  options: {
    fileService: FileService;
    sketchesService: SketchesService;
    labelProvider: LabelProvider;
    dialogService: DialogService;
  }
): Promise<Sketch | undefined> {
  const { fileService, sketchesService, labelProvider, dialogService } =
    options;
  const uri =
    sketchFileUri instanceof URI ? sketchFileUri : new URI(sketchFileUri);
  const name = uri.path.name;
  const nameWithExt = labelProvider.getName(uri);
  const { response } = await dialogService.showMessageBox({
    title: nls.localize('arduino/sketch/moving', '移动'),
    type: 'question',
    buttons: [
      nls.localize('vscode/issueMainService/cancel', '取消'),
      nls.localize('vscode/issueMainService/ok', '确定'),
    ],
    message: `文件“${nameWithExt}”需要在名为“${name}”的草图文件夹中。创建这个文件夹，移动文件，然后继续？`,
  });
  if (response === 1) {
    // OK
    const newSketchUri = uri.parent.resolve(name);
    const exists = await fileService.exists(newSketchUri);
    if (exists) {
      await dialogService.showMessageBox({
        type: 'error',
        title: '错误',
        message: `已经存在名为“${name}”的文件夹。不能打开草图。`,
      });
      return undefined;
    }
    await fileService.createFolder(newSketchUri);
    await fileService.move(
      uri,
      new URI(newSketchUri.resolve(nameWithExt).toString())
    );
    return sketchesService.getSketchFolder(newSketchUri.toString());
  }
}
