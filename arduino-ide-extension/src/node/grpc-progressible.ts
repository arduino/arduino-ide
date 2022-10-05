import { v4 } from 'uuid';
import {
  IndexType,
  IndexUpdateDidCompleteParams,
  IndexUpdateDidFailParams,
  IndexUpdateSummary,
  IndexUpdateWillStartParams,
} from '../common/protocol';
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
  DownloadProgressStart,
  DownloadProgressUpdate,
  DownloadProgressEnd,
} from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';
import { CompileResponse } from './cli-protocol/cc/arduino/cli/commands/v1/compile_pb';
import {
  PlatformInstallResponse,
  PlatformUninstallResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/core_pb';
import {
  LibraryInstallResponse,
  LibraryUninstallResponse,
  ZipLibraryInstallResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/lib_pb';
import {
  BurnBootloaderResponse,
  UploadResponse,
  UploadUsingProgrammerResponse,
} from './cli-protocol/cc/arduino/cli/commands/v1/upload_pb';

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
    return {
      download: response.getDownloadProgress(),
    };
  }
}
/**
 * These responses have neither `task` nor `progress` property but for the sake of completeness
 * on typings (from the gRPC API) and UX, these responses represent an indefinite progress.
 */
type IndefiniteProgressResponse =
  | UploadResponse
  | UploadUsingProgrammerResponse
  | BurnBootloaderResponse;
namespace IndefiniteProgressResponse {
  export function is(
    response: unknown
  ): response is IndefiniteProgressResponse {
    return (
      response instanceof UploadResponse ||
      response instanceof UploadUsingProgrammerResponse ||
      response instanceof BurnBootloaderResponse
    );
  }
}
type DefiniteProgressResponse = CompileResponse;
namespace DefiniteProgressResponse {
  export function is(response: unknown): response is DefiniteProgressResponse {
    return response instanceof CompileResponse;
  }
}
type CoreProgressResponse =
  | DefiniteProgressResponse
  | IndefiniteProgressResponse;
namespace CoreProgressResponse {
  export function is(response: unknown): response is CoreProgressResponse {
    return (
      DefiniteProgressResponse.is(response) ||
      IndefiniteProgressResponse.is(response)
    );
  }
  export function workUnit(response: CoreProgressResponse): UnitOfWork {
    if (DefiniteProgressResponse.is(response)) {
      return { task: response.getProgress() };
    }
    return UnitOfWork.Unknown;
  }
}

export type ProgressResponse =
  | LibraryProgressResponse
  | PlatformProgressResponse
  | IndexProgressResponse
  | CoreProgressResponse;

interface UnitOfWork {
  task?: TaskProgress;
  download?: DownloadProgress;
}
namespace UnitOfWork {
  export const Unknown: UnitOfWork = {};
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
    /**
     * It's only relevant for index updates to build a summary of possible client (4xx) and server (5xx) errors when downloading the files during the index update. It's missing for lib/platform installations.
     */
    readonly reportResult?: (result: DownloadResult) => void;
  }

  export function createDataCallback<R extends ProgressResponse>({
    responseService,
    progressId,
    reportResult,
  }: ExecuteWithProgress.Options): (response: R) => void {
    const uuid = v4();
    let message = '';
    let url = '';
    return (response: R) => {
      if (DEBUG) {
        const json = toJson(response);
        if (json) {
          console.debug(`[gRPC progress] Progress response [${uuid}]: ${json}`);
        }
      }
      const unitOfWork = resolve(response);
      const { task, download } = unitOfWork;
      if (!download && !task) {
        // Report a fake unknown progress if progress ID is available.
        // When a progress ID is available, a connected client is setting the progress ID.
        // Hence, it's listening to progress updates.
        if (unitOfWork === UnitOfWork.Unknown && progressId) {
          if (progressId) {
            responseService.reportProgress?.({
              progressId,
              message: '',
              work: { done: Number.NaN, total: Number.NaN },
            });
          }
          return;
        }
        if (DEBUG) {
          // This is still an API error from the CLI, but IDE2 ignores it.
          // Technically, it does not cause an error, but could mess up the progress reporting.
          // See an example of an empty object `{}` repose here: https://github.com/arduino/arduino-ide/issues/906#issuecomment-1171145630.
          console.warn(
            `Implementation error. None of the following properties were available on the response: 'task', 'download'`
          );
        }
        return;
      }
      if (task && download) {
        throw new Error(
          "Implementation error. Both 'download' and 'task' are available."
        );
      }
      if (task) {
        const message = task.getName() || task.getMessage();
        const percent = task.getPercent();
        if (message) {
          if (progressId) {
            responseService.reportProgress?.({
              progressId,
              message,
              work: { done: Number.NaN, total: Number.NaN },
            });
          }
          responseService.appendToOutput?.({ chunk: `${message}\n` });
        } else if (percent) {
          if (progressId) {
            responseService.reportProgress?.({
              progressId,
              message,
              work: { done: percent, total: 100 },
            });
          }
        }
      } else if (download) {
        const phase = phaseOf(download);
        if (phase instanceof DownloadProgressStart) {
          message = phase.getLabel();
          url = phase.getUrl();
          responseService.appendToOutput?.({ chunk: `${message}\n` });
        } else if (phase instanceof DownloadProgressUpdate) {
          if (progressId && message) {
            responseService.reportProgress?.({
              progressId,
              message,
              work: {
                total: phase.getTotalSize(),
                done: phase.getDownloaded(),
              },
            });
          }
        } else if (phase instanceof DownloadProgressEnd) {
          if (url && reportResult) {
            reportResult({
              url,
              message: phase.getMessage(),
              success: phase.getSuccess(),
            });
          }
          message = '';
          url = '';
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
    } else if (CoreProgressResponse.is(response)) {
      return CoreProgressResponse.workUnit(response);
    }
    console.warn('Unhandled gRPC response', response);
    return {};
  }
  function toJson(response: ProgressResponse): string | undefined {
    return JSON.stringify(response.toObject(false));
  }
  function phaseOf(
    download: DownloadProgress
  ): DownloadProgressStart | DownloadProgressUpdate | DownloadProgressEnd {
    let start: undefined | DownloadProgressStart = undefined;
    let update: undefined | DownloadProgressUpdate = undefined;
    let end: undefined | DownloadProgressEnd = undefined;
    if (download.hasStart()) {
      start = download.getStart();
    } else if (download.hasUpdate()) {
      update = download.getUpdate();
    } else if (download.hasEnd()) {
      end = download.getEnd();
    } else {
      throw new Error(
        `Download progress does not have a 'start', 'update', and 'end'. ${JSON.stringify(
          download.toObject(false)
        )}`
      );
    }
    if (start) {
      return start;
    } else if (update) {
      return update;
    } else if (end) {
      return end;
    } else {
      throw new Error(
        `Download progress does not have a 'start', 'update', and 'end'. ${JSON.stringify(
          download.toObject(false)
        )}`
      );
    }
  }
}

export class IndexesUpdateProgressHandler {
  private done = 0;
  private readonly total: number;
  readonly progressId: string;
  readonly results: DownloadResult[];

  constructor(
    private types: IndexType[],
    additionalUrlsCount: number,
    private readonly options: {
      onProgress: (progressMessage: ProgressMessage) => void;
      onError?: (params: IndexUpdateDidFailParams) => void;
      onStart?: (params: IndexUpdateWillStartParams) => void;
      onComplete?: (params: IndexUpdateDidCompleteParams) => void;
    }
  ) {
    this.progressId = v4();
    this.results = [];
    this.total = IndexesUpdateProgressHandler.total(types, additionalUrlsCount);
    // Note: at this point, the IDE2 backend might not have any connected clients, so this notification is not delivered to anywhere
    // Hence, clients must handle gracefully when no `willStart` event is received before any `didProgress`.
    this.options.onStart?.({ progressId: this.progressId, types });
  }

  reportEnd(): void {
    const updatedAt = new Date().toISOString();
    this.options.onComplete?.({
      progressId: this.progressId,
      summary: this.types.reduce((summary, type) => {
        summary[type] = updatedAt;
        return summary;
      }, {} as IndexUpdateSummary),
    });
  }

  reportProgress(message: string): void {
    this.options.onProgress({
      message,
      progressId: this.progressId,
      work: { total: this.total, done: ++this.done },
    });
  }

  reportError(message: string): void {
    this.options.onError?.({
      progressId: this.progressId,
      message,
      types: this.types,
    });
  }

  reportResult(result: DownloadResult): void {
    this.results.push(result);
  }

  private static total(
    types: IndexType[],
    additionalUrlsCount: number
  ): number {
    let total = 0;
    if (types.includes('library')) {
      // The `library_index.json.gz` and `library_index.json.sig` when running the library index update.
      total += 2;
    }
    if (types.includes('platform')) {
      // +1 for the `package_index.tar.bz2` when updating the platform index.
      total += additionalUrlsCount + 1;
    }
    // +1 for the `initInstance` call after the index update (`reportEnd`)
    return total + 1;
  }
}

export interface DownloadResult {
  readonly url: string;
  readonly success: boolean;
  readonly message?: string;
}
export namespace DownloadResult {
  export function isError(
    arg: DownloadResult
  ): arg is DownloadResult & { message: string } {
    return !!arg.message && !arg.success;
  }
}
