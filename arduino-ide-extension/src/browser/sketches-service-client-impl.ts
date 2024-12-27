import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { notEmpty } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileChangeType } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { Sketch, SketchesService } from '../common/protocol';
import { ConfigServiceClient } from './config/config-service-client';
import {
  SketchContainer,
  SketchesError,
  SketchRef,
} from '../common/protocol/sketches-service';
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from './utils/constants';
import * as monaco from '@theia/monaco-editor-core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';

const READ_ONLY_FILES = ['sketch.json'];
const READ_ONLY_FILES_REMOTE = ['thingProperties.h', 'thingsProperties.h'];

export type CurrentSketch = Sketch | 'invalid';
export namespace CurrentSketch {
  export function isValid(arg: CurrentSketch | undefined): arg is Sketch {
    return !!arg && arg !== 'invalid';
  }
}

@injectable()
export class SketchesServiceClientImpl
  implements FrontendApplicationContribution {
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;
  @inject(ConfigServiceClient)
  private readonly configService: ConfigServiceClient;
  @inject(FrontendApplicationStateService)
  private readonly appStateService: FrontendApplicationStateService;

  private sketches = new Map<string, SketchRef>();
  private onSketchbookDidChangeEmitter = new Emitter<{
    created: SketchRef[];
    removed: SketchRef[];
  }>();
  readonly onSketchbookDidChange = this.onSketchbookDidChangeEmitter.event;
  private currentSketchDidChangeEmitter = new Emitter<CurrentSketch>();
  readonly onCurrentSketchDidChange = this.currentSketchDidChangeEmitter.event;

  private toDisposeBeforeWatchSketchbookDir = new DisposableCollection();
  private toDispose = new DisposableCollection(
    this.onSketchbookDidChangeEmitter,
    this.currentSketchDidChangeEmitter,
    this.toDisposeBeforeWatchSketchbookDir
  );

  private _currentSketch: CurrentSketch | undefined;
  private _currentIdeTempFolderUri: URI | undefined;
  private currentSketchLoaded = new Deferred<CurrentSketch>();

  async onStart(): Promise<void> {
    await this.init();
  }

  async init(fa = false): Promise<void> {
    // 从配置服务中尝试获取草图目录的 URI
    const sketchDirUri = this.configService.tryGetSketchDirUri();
    // 监视草图目录
    this.watchSketchbookDir(sketchDirUri);
    // 定义一个异步函数 refreshCurrentSketch，用于刷新当前草图
    const refreshCurrentSketch = async () => {
      // 加载当前草图
      const currentSketch = await this.loadCurrentSketch();
      // 获取当前草图的 IDE 临时文件夹 URI
      const ideTempFolderUri = await this.getIdeTempFolderUriForSketch(
        currentSketch
      );
      // 使用当前草图和 IDE 临时文件夹 URI
      await this.useCurrentSketch(currentSketch, ideTempFolderUri, fa);
    };
    // 将配置服务中的草图目录 URI 变化事件监听器添加到待处理资源列表中
    this.toDispose.push(
      this.configService.onDidChangeSketchDirUri((sketchDirUri) => {
        // 当草图目录 URI 发生变化时，重新监视新的草图目录
        this.watchSketchbookDir(sketchDirUri);
        // 刷新当前草图
        refreshCurrentSketch();
      })
    );
    // 当应用状态服务达到 'started_contributions' 状态时，刷新当前草图
    this.appStateService
      .reachedState('started_contributions')
      .then(refreshCurrentSketch);
  }

  private async watchSketchbookDir(
    sketchDirUri: URI | undefined
  ): Promise<void> {
    this.toDisposeBeforeWatchSketchbookDir.dispose();
    if (!sketchDirUri) {
      return;
    }
    const container = await this.sketchesService.getSketches({
      uri: sketchDirUri.toString(),
    });
    for (const sketch of SketchContainer.toArray(container)) {
      this.sketches.set(sketch.uri, sketch);
    }
    this.toDisposeBeforeWatchSketchbookDir.pushAll([
      Disposable.create(() => this.sketches.clear()),
      // Watch changes in the sketchbook to update `File` > `Sketchbook` menu items.
      this.fileService.watch(sketchDirUri, {
        recursive: true,
        excludes: [],
      }),
      this.fileService.onDidFilesChange(async (event) => {
        for (const { type, resource } of event.changes) {
          // The file change events have higher precedence in the current sketch over the sketchbook.
          if (
            CurrentSketch.isValid(this._currentSketch) &&
            new URI(this._currentSketch.uri).isEqualOrParent(resource)
          ) {
            // https://github.com/arduino/arduino-ide/pull/1351#pullrequestreview-1086666656
            // On a sketch file rename, the FS watcher will contain two changes:
            //  - Deletion of the original file,
            //  - Update of the new file,
            // Hence, `UPDATE` events must be processed but only and if only there is a `DELETED` change in the same event.
            // Otherwise, IDE2 would ask CLI to reload the sketch content on every save event in IDE2.
            if (type === FileChangeType.UPDATED && event.changes.length === 1) {
              // If the event contains only one `UPDATE` change, it cannot be a rename.
              return;
            }

            let reloadedSketch: Sketch | undefined = undefined;
            try {
              reloadedSketch = await this.sketchesService.loadSketch(
                this._currentSketch.uri
              );
            } catch (err) {
              if (!SketchesError.NotFound.is(err)) {
                throw err;
              }
            }

            if (!reloadedSketch) {
              return;
            }

            // 检查当前草图对象（this._currentSketch）是否与重新加载的草图对象（reloadedSketch）相同
            if (!Sketch.sameAs(this._currentSketch, reloadedSketch)) {
              // 如果不相同，则获取与重新加载的草图对象关联的IDE临时文件夹的URI
              const ideTempFolderUri = await this.getIdeTempFolderUriForSketch(
                reloadedSketch
              );
              // 使用重新加载的草图对象和其对应的IDE临时文件夹URI来更新当前草图
              // 第三个参数为true，表示需要重新加载
              this.useCurrentSketch(reloadedSketch, ideTempFolderUri, true);
            }
            return;
          }
          // We track main sketch files changes only. // TODO: check sketch folder changes. One can rename the folder without renaming the `.ino` file.
          if (sketchDirUri.isEqualOrParent(resource)) {
            if (Sketch.isSketchFile(resource)) {
              if (type === FileChangeType.ADDED) {
                try {
                  const toAdd = await this.sketchesService.loadSketch(
                    resource.parent.toString()
                  );
                  if (!this.sketches.has(toAdd.uri)) {
                    console.log(
                      `New sketch '${toAdd.name}' was created in sketchbook '${sketchDirUri}'.`
                    );
                    this.sketches.set(toAdd.uri, toAdd);
                    this.fireSoon(toAdd, 'created');
                  }
                } catch { }
              } else if (type === FileChangeType.DELETED) {
                const uri = resource.parent.toString();
                const toDelete = this.sketches.get(uri);
                if (toDelete) {
                  console.log(
                    `Sketch '${toDelete.name}' was removed from sketchbook '${sketchDirUri}'.`
                  );
                  this.sketches.delete(uri);
                  this.fireSoon(toDelete, 'removed');
                }
              }
            }
          }
        }
      }),
    ]);
  }

  private async getIdeTempFolderUriForSketch(
    sketch: CurrentSketch
  ): Promise<URI | undefined> {
    if (CurrentSketch.isValid(sketch)) {
      const uri = await this.sketchesService.getIdeTempFolderUri(sketch);
      return new URI(uri);
    }
    return undefined;
  }

  private async useCurrentSketch(
    currentSketch: CurrentSketch,
    ideTempFolderUri: URI | undefined,
    reassignPromise = false
  ): Promise<void> {
    // 将传入的当前草图对象赋值给类的私有属性 _currentSketch
    this._currentSketch = currentSketch;
    // 将传入的临时文件夹 URI 赋值给类的私有属性 _currentIdeTempFolderUri
    this._currentIdeTempFolderUri = ideTempFolderUri;
    // 如果 reassignPromise 为 true，则创建一个新的延迟对象并赋值给 currentSketchLoaded 属性
    if (reassignPromise) {
      this.currentSketchLoaded = new Deferred();
    }
    // 触发 currentSketchLoaded 的 resolve 方法，传入当前草图对象，表明当前草图已加载完成
    this.currentSketchLoaded.resolve(this._currentSketch);
    // 触发 currentSketchDidChangeEmitter 事件，传入当前草图对象，表示当前草图发生了变化
    this.currentSketchDidChangeEmitter.fire(this._currentSketch);
  }

  onStop(): void {
    this.toDispose.dispose();
  }

  // 定义一个私有异步方法 loadCurrentSketch，返回一个 Promise，解析为 CurrentSketch 类型
  private async loadCurrentSketch(): Promise<CurrentSketch> {
    // 调用 workspaceService 的 tryGetRoots 方法获取工作区的根目录，并映射每个根目录
    // 使用 sketchesService 的 getSketchFolder 方法获取每个根目录下的草图文件夹
    // 使用 Promise.all 并行处理所有异步操作，并等待所有操作完成
    const sketches = (
      await Promise.all(
        this.workspaceService.tryGetRoots().map(({ resource }) => {
          return this.sketchesService.getSketchFolder(resource.toString());
        })
      )
    ).filter(notEmpty);
    if (!sketches.length) {
      return 'invalid';
    }
    if (sketches.length > 1) {
      console.log(
        `Multiple sketch folders were found in the workspace. Falling back to the first one. Sketch folders: ${JSON.stringify(
          sketches
        )}`
      );
    }
    return sketches[0];
  }

  async currentSketch(): Promise<CurrentSketch> {
    // 返回 currentSketchLoaded 的 Promise，当这个 Promise 被解析时，它将提供当前的草图对象（CurrentSketch 类型）。
    return this.currentSketchLoaded.promise;
  }

  tryGetCurrentSketch(): CurrentSketch | undefined {
    return this._currentSketch;
  }

  async currentSketchFile(): Promise<string | undefined> {
    const currentSketch = await this.currentSketch();
    if (CurrentSketch.isValid(currentSketch)) {
      return currentSketch.mainFileUri;
    }
    return undefined;
  }

  private fireSoonHandle?: number;
  private bufferedSketchbookEvents: {
    type: 'created' | 'removed';
    sketch: SketchRef;
  }[] = [];

  private fireSoon(sketch: SketchRef, type: 'created' | 'removed'): void {
    this.bufferedSketchbookEvents.push({ type, sketch });

    if (typeof this.fireSoonHandle === 'number') {
      window.clearTimeout(this.fireSoonHandle);
    }

    this.fireSoonHandle = window.setTimeout(() => {
      const event: { created: SketchRef[]; removed: SketchRef[] } = {
        created: [],
        removed: [],
      };
      for (const { type, sketch } of this.bufferedSketchbookEvents) {
        if (type === 'created') {
          event.created.push(sketch);
        } else {
          event.removed.push(sketch);
        }
      }
      this.onSketchbookDidChangeEmitter.fire(event);
      this.bufferedSketchbookEvents.length = 0;
    }, 100);
  }

  /**
   * `true` if the `uri` is not contained in any of the opened workspaces. Otherwise, `false`.
   */
  isReadOnly(uri: URI | monaco.Uri | string): boolean {
    const toCheck = uri instanceof URI ? uri : new URI(uri);
    if (toCheck.scheme === 'user-storage') {
      return false;
    }

    if (
      this._currentIdeTempFolderUri &&
      this._currentIdeTempFolderUri.resolve('launch.json').toString() ===
      toCheck.toString()
    ) {
      return false;
    }

    const isCloudSketch = toCheck
      .toString()
      .includes(`${REMOTE_SKETCHBOOK_FOLDER}/${ARDUINO_CLOUD_FOLDER}`);

    const filesToCheck = [
      ...READ_ONLY_FILES,
      ...(isCloudSketch ? READ_ONLY_FILES_REMOTE : []),
    ];

    if (filesToCheck.includes(toCheck?.path?.base)) {
      return true;
    }
    const readOnly = !this.workspaceService
      .tryGetRoots()
      .some(({ resource }) => resource.isEqualOrParent(toCheck));
    return readOnly;
  }
}
