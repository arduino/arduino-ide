import { v4 } from 'uuid';
import {
  ProgressMessage,
  ResponseService,
} from '../common/protocol/response-service';
import {
  UpdateCoreLibrariesIndexResponse,
  UpdateIndexResponse,
  UpdateLibrariesIndexResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import {
  DownloadProgress,
  TaskProgress,
} from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import {
  PlatformInstallResponse,
  PlatformUninstallResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/core_pb';
import {
  LibraryInstallResponse,
  LibraryUninstallResponse,
  ZipLibraryInstallResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/lib_pb';

type LibraryProgressResponse =
  | LibraryInstallResponse
  | LibraryUninstallResponse
  | ZipLibraryInstallResponse;
namespace LibraryProgressResponse {
  export function is(response: unknown): response is LibraryProgressResponse {
    return (
      response instanceof LibraryInstallResponse ||
      response instanceof LibraryUninstallResponse ||
      response instanceof ZipLibraryInstallResponse
    );
  }
  export function workUnit(response: LibraryProgressResponse): UnitOfWork {
    return {
      task: response.getTaskProgress(),
      ...(response instanceof LibraryInstallResponse && {
        download: response.getProgress(),
      }),
    };
  }
}
type PlatformProgressResponse =
  | PlatformInstallResponse
  | PlatformUninstallResponse;
namespace PlatformProgressResponse {
  export function is(response: unknown): response is PlatformProgressResponse {
    return (
      response instanceof PlatformInstallResponse ||
      response instanceof PlatformUninstallResponse
    );
  }
  export function workUnit(response: PlatformProgressResponse): UnitOfWork {
    return {
      task: response.getTaskProgress(),
      ...(response instanceof PlatformInstallResponse && {
        download: response.getProgress(),
      }),
    };
  }
}
type IndexProgressResponse =
  | UpdateIndexResponse
  | UpdateLibrariesIndexResponse
  | UpdateCoreLibrariesIndexResponse;
namespace IndexProgressResponse {
  export function is(response: unknown): response is IndexProgressResponse {
    return (
      response instanceof UpdateIndexResponse ||
      response instanceof UpdateLibrariesIndexResponse ||
      response instanceof UpdateCoreLibrariesIndexResponse // not used by the IDE2 but available for full typings compatibility
    );
  }
  export function workUnit(response: IndexProgressResponse): UnitOfWork {
    return { download: response.getDownloadProgress() };
  }
}
export type ProgressResponse =
  | LibraryProgressResponse
  | PlatformProgressResponse
  | IndexProgressResponse;

interface UnitOfWork {
  task?: TaskProgress;
  download?: DownloadProgress;
}

/**
 * It's solely a dev thing. Flip it to `true` if you want to debug the progress from the CLI responses.
 */
const DEBUG = false;
export namespace ExecuteWithProgress {
  export interface Options {
    /**
     * _unknown_ progress if falsy.
     */
    readonly progressId?: string;
    readonly responseService: Partial<ResponseService>;
  }

  export function createDataCallback<R extends ProgressResponse>({
    responseService,
    progressId,
  }: ExecuteWithProgress.Options): (response: R) => void {
    const uuid = v4();
    let localFile = '';
    let localTotalSize = Number.NaN;
    return (response: R) => {
      if (DEBUG) {
        const json = toJson(response);
        if (json) {
          console.log(`Progress response [${uuid}]: ${json}`);
        }
      }
      const { task, download } = resolve(response);
      if (!download && !task) {
        console.warn(
          "Implementation error. Neither 'download' nor 'task' is available."
        );
        // This is still an API error from the CLI, but IDE2 ignores it.
        // Technically, it does not cause an error, but could mess up the progress reporting.
        // See an example of an empty object `{}` repose here: https://github.com/arduino/arduino-ide/issues/906#issuecomment-1171145630.
        return;
      }
      if (task && download) {
        throw new Error(
          "Implementation error. Both 'download' and 'task' are available."
        );
      }
      if (task) {
        const message = task.getName() || task.getMessage();
        if (message) {
          if (progressId) {
            responseService.reportProgress?.({
              progressId,
              message,
              work: { done: Number.NaN, total: Number.NaN },
            });
          }
          responseService.appendToOutput?.({ chunk: `${message}\n` });
        }
      } else if (download) {
        if (download.getFile() && !localFile) {
          localFile = download.getFile();
        }
        if (download.getTotalSize() > 0 && Number.isNaN(localTotalSize)) {
          localTotalSize = download.getTotalSize();
        }

        // This happens only once per file download.
        if (download.getTotalSize() && localFile) {
          responseService.appendToOutput?.({ chunk: `${localFile}\n` });
        }

        if (progressId && localFile) {
          let work: ProgressMessage.Work | undefined = undefined;
          if (download.getDownloaded() > 0 && !Number.isNaN(localTotalSize)) {
            work = {
              total: localTotalSize,
              done: download.getDownloaded(),
            };
          }
          responseService.reportProgress?.({
            progressId,
            message: `Downloading ${localFile}`,
            work,
          });
        }
        if (download.getCompleted()) {
          // Discard local state.
          if (progressId && !Number.isNaN(localTotalSize)) {
            responseService.reportProgress?.({
              progressId,
              message: '',
              work: { done: Number.NaN, total: Number.NaN },
            });
          }
          localFile = '';
          localTotalSize = Number.NaN;
        }
      }
    };
  }
  function resolve(response: unknown): Readonly<Partial<UnitOfWork>> {
    if (LibraryProgressResponse.is(response)) {
      return LibraryProgressResponse.workUnit(response);
    } else if (PlatformProgressResponse.is(response)) {
      return PlatformProgressResponse.workUnit(response);
    } else if (IndexProgressResponse.is(response)) {
      return IndexProgressResponse.workUnit(response);
    }
    console.warn('Unhandled gRPC response', response);
    return {};
  }
  function toJson(response: ProgressResponse): string | undefined {
    if (response instanceof LibraryInstallResponse) {
      return JSON.stringify(LibraryInstallResponse.toObject(false, response));
    } else if (response instanceof LibraryUninstallResponse) {
      return JSON.stringify(LibraryUninstallResponse.toObject(false, response));
    } else if (response instanceof ZipLibraryInstallResponse) {
      return JSON.stringify(
        ZipLibraryInstallResponse.toObject(false, response)
      );
    } else if (response instanceof PlatformInstallResponse) {
      return JSON.stringify(PlatformInstallResponse.toObject(false, response));
    } else if (response instanceof PlatformUninstallResponse) {
      return JSON.stringify(
        PlatformUninstallResponse.toObject(false, response)
      );
    } else if (response instanceof UpdateIndexResponse) {
      return JSON.stringify(UpdateIndexResponse.toObject(false, response));
    } else if (response instanceof UpdateLibrariesIndexResponse) {
      return JSON.stringify(
        UpdateLibrariesIndexResponse.toObject(false, response)
      );
    } else if (response instanceof UpdateCoreLibrariesIndexResponse) {
      return JSON.stringify(
        UpdateCoreLibrariesIndexResponse.toObject(false, response)
      );
    }
    console.warn('Unhandled gRPC response', response);
    return undefined;
  }
}

export class IndexesUpdateProgressHandler {
  private done = 0;
  private readonly total: number;
  readonly progressId: string;

  constructor(
    additionalUrlsCount: number,
    private readonly onProgress: (progressMessage: ProgressMessage) => void,
    private readonly onError?: ({
      progressId,
      message,
    }: {
      progressId: string;
      message: string;
    }) => void,
    private readonly onStart?: (progressId: string) => void,
    private readonly onEnd?: (progressId: string) => void
  ) {
    this.progressId = v4();
    this.total = IndexesUpdateProgressHandler.total(additionalUrlsCount);
    // Note: at this point, the IDE2 backend might not have any connected clients, so this notification is not delivered to anywhere
    // Hence, clients must handle gracefully when no `willUpdate` is received before any `didProgress`.
    this.onStart?.(this.progressId);
  }

  reportEnd(): void {
    this.onEnd?.(this.progressId);
  }

  reportProgress(message: string): void {
    this.onProgress({
      message,
      progressId: this.progressId,
      work: { total: this.total, done: ++this.done },
    });
  }

  reportError(message: string): void {
    this.onError?.({ progressId: this.progressId, message });
  }

  private static total(additionalUrlsCount: number): number {
    // +1 for the `package_index.tar.bz2` when updating the platform index.
    const totalPlatformIndexCount = additionalUrlsCount + 1;
    // The `library_index.json.gz` and `library_index.json.sig` when running the library index update.
    const totalLibraryIndexCount = 2;
    // +1 for the `initInstance` call after the index update (`reportEnd`)
    return totalPlatformIndexCount + totalLibraryIndexCount + 1;
  }
}
