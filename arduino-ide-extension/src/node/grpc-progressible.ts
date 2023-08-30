import { isObject } from '@theia/core/lib/common/types';
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
import type { UnknownObject } from '../common/types';
import type {
  BurnBootloaderResponse,
  CompileResponse,
  DownloadProgress,
  DownloadProgressEnd,
  DownloadProgressStart,
  DownloadProgressUpdate,
  LibraryInstallResponse,
  LibraryUninstallResponse,
  PlatformInstallResponse,
  PlatformUninstallResponse,
  Port,
  TaskProgress,
  UpdateIndexResponse,
  UpdateLibrariesIndexResponse,
  UploadResponse,
  UploadResult,
  UploadUsingProgrammerResponse,
  ZipLibraryInstallResponse,
} from './cli-api/';

type LibraryProgressResponse =
  | LibraryInstallResponse
  | LibraryUninstallResponse
  | ZipLibraryInstallResponse;
// namespace LibraryProgressResponse {
//   export function is(response: unknown): response is LibraryProgressResponse {
//     return (
//       response instanceof LibraryInstallResponse ||
//       response instanceof LibraryUninstallResponse ||
//       response instanceof ZipLibraryInstallResponse
//     );
//   }
//   export function workUnit(response: LibraryProgressResponse): UnitOfWork {
//     return {
//       task: response.getTaskProgress(),
//       ...(response instanceof LibraryInstallResponse && {
//         download: response.getProgress(),
//       }),
//     };
//   }
// }
type PlatformProgressResponse =
  | PlatformInstallResponse
  | PlatformUninstallResponse;
// namespace PlatformProgressResponse {
//   export function is(response: unknown): response is PlatformProgressResponse {
//     return (
//       response instanceof PlatformInstallResponse ||
//       response instanceof PlatformUninstallResponse
//     );
//   }
//   export function workUnit(response: PlatformProgressResponse): UnitOfWork {
//     return {
//       task: response.getTaskProgress(),
//       ...(response instanceof PlatformInstallResponse && {
//         download: response.getProgress(),
//       }),
//     };
//   }
// }
type IndexProgressResponse = UpdateIndexResponse | UpdateLibrariesIndexResponse;
// namespace IndexProgressResponse {
//   export function is(response: unknown): response is IndexProgressResponse {
//     return (
//       response instanceof UpdateIndexResponse ||
//       response instanceof UpdateLibrariesIndexResponse
//     );
//   }
//   export function workUnit(response: IndexProgressResponse): UnitOfWork {
//     return {
//       download: response.getDownloadProgress(),
//     };
//   }
// }
// /**
//  * These responses have neither `task` nor `progress` property but for the sake of completeness
//  * on typings (from the gRPC API) and UX, these responses represent an indefinite progress.
//  */
type IndefiniteProgressResponse =
  | UploadResponse
  | UploadUsingProgrammerResponse
  | BurnBootloaderResponse;
// namespace IndefiniteProgressResponse {
//   export function is(
//     response: unknown
//   ): response is IndefiniteProgressResponse {
//     return (
//       response instanceof UploadResponse ||
//       response instanceof UploadUsingProgrammerResponse ||
//       response instanceof BurnBootloaderResponse
//     );
//   }
// }
type DefiniteProgressResponse = CompileResponse;
// namespace DefiniteProgressResponse {
//   export function is(response: unknown): response is DefiniteProgressResponse {
//     return response instanceof CompileResponse;
//   }
// }
type CoreProgressResponse =
  | DefiniteProgressResponse
  | IndefiniteProgressResponse;
// namespace CoreProgressResponse {
//   export function is(response: unknown): response is CoreProgressResponse {
//     return (
//       DefiniteProgressResponse.is(response) ||
//       IndefiniteProgressResponse.is(response)
//     );
//   }
//   export function workUnit(response: CoreProgressResponse): UnitOfWork {
//     if (DefiniteProgressResponse.is(response)) {
//       return { task: response.getProgress() };
//     }
//     return UnitOfWork.Unknown;
//   }
// }

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

export type CalculateWork<R extends ProgressResponse> = (resp: R) => UnitOfWork;

// export const calculateLibraryProgressWork: CalculateWork<LibraryProgressResponse> = (resp: LibraryProgressResponse) => ({})

/**
 * It's solely a dev thing. Flip it to `true` if you want to debug the progress from the CLI responses.
 */
const DEBUG = false;
export namespace ExecuteWithProgress {
  export interface Options<R extends ProgressResponse> {
    /**
     * _unknown_ progress if falsy.
     */
    readonly progressId?: string;
    readonly responseService: Partial<ResponseService>;
    /**
     * It's only relevant for index updates to build a summary of possible client (4xx) and server (5xx) errors when downloading the files during the index update. It's missing for lib/platform installations.
     */
    readonly reportResult?: (result: DownloadResult) => void;
    /**
     * It's the client's responsibility to extract the `task` and `download` from the responses.
     * The CLI's gRPC API is neither symmetric, nor behaves the same way when the structural types match.
     * For example, some server streaming commands do not provide progress, some provide indefinite,
     * but there are definite (`compile`) ones.
     */
    readonly calculateWork?: CalculateWork<R>;
  }

  export function createDataCallback<R extends ProgressResponse>({
    responseService,
    progressId,
    reportResult,
    calculateWork,
  }: ExecuteWithProgress.Options<R>): (response: R) => void {
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
      const unitOfWork = calculateWork?.(response) ?? UnitOfWork.Unknown;
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
        const message = task.name || task.message;
        const percent = task.percent;
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
        const { type, phase } = phaseOf(download);
        if (type === 'start') {
          message = phase.label;
          url = phase.url;
          responseService.appendToOutput?.({ chunk: `${message}\n` });
        } else if (type === 'update') {
          if (progressId && message) {
            responseService.reportProgress?.({
              progressId,
              message,
              work: {
                total: phase.totalSize,
                done: phase.downloaded,
              },
            });
          }
        } else if (type === 'end') {
          if (url && reportResult) {
            reportResult({
              url,
              message: phase.message,
              success: phase.success,
            });
          }
          message = '';
          url = '';
        }
      }
    };
  }
  function toJson(response: ProgressResponse): string | undefined {
    return JSON.stringify(response);
  }
  function phaseOf(
    download: DownloadProgress
  ):
    | { type: 'start'; phase: DownloadProgressStart }
    | { type: 'update'; phase: DownloadProgressUpdate }
    | { type: 'end'; phase: DownloadProgressEnd } {
    let start: undefined | DownloadProgressStart = undefined;
    let update: undefined | DownloadProgressUpdate = undefined;
    let end: undefined | DownloadProgressEnd = undefined;

    switch (download.message?.$case) {
      case 'start': {
        start = download.message.start;
        break;
      }
      case 'end': {
        end = download.message.end;
        break;
      }
      case 'update': {
        update = download.message.update;
        break;
      }
    }
    if (start) {
      return { type: 'start', phase: start };
    } else if (update) {
      return { type: 'update', phase: update };
    } else if (end) {
      return { type: 'end', phase: end };
    } else {
      throw new Error(
        `Download progress does not have a 'start', 'update', and 'end'. ${JSON.stringify(
          download
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

export function isGrpcUploadResponse(
  arg: unknown
): arg is Exclude<UploadResponse, undefined> {
  return (
    isObject(arg) &&
    (<UploadResponse>arg).message !== undefined &&
    (isMessageCase(arg, 'outStream', (value) => Array.isArray(value)) ||
      isMessageCase(arg, 'errStream', (value) => Array.isArray(value)) ||
      isMessageCase(arg, 'result', (value) => isUploadResult(value)))
  );
}

function isUploadResult(arg: unknown): arg is UploadResult {
  return (
    isObject<UploadResult>(arg) &&
    (<UploadResult>arg).updatedUploadPort !== undefined &&
    isPort((<UploadResult>arg).updatedUploadPort)
  );
}

function isPort(arg: unknown): arg is Port {
  return (
    ((isObject<Port>(arg) &&
      (<Port>arg).address !== undefined &&
      typeof (<Port>arg).address === 'string' &&
      (<Port>arg).label !== undefined &&
      typeof (<Port>arg).label === 'string' &&
      (<Port>arg).protocol !== undefined &&
      typeof (<Port>arg).protocol === 'string' &&
      (<Port>arg).protocolLabel !== undefined &&
      typeof (<Port>arg).protocolLabel === 'string' &&
      (<Port>arg).hardwareId === undefined) ||
      ((<Port>arg).hardwareId !== undefined &&
        typeof (<Port>arg).hardwareId === 'string')) &&
    isObject((<Port>arg).properties)
  );
}

function isMessageCase(
  arg: unknown,
  assertName: string,
  assertValue: (value: unknown) => boolean
): arg is { $case: typeof assertName; assertName: unknown } {
  if (hasSingleMessageProperty(arg)) {
    const { message } = arg;
    const $case = message['$case'];
    return (
      typeof $case === 'string' &&
      $case in message &&
      Object.keys(message).length === 2
    );
  }
  return isObject(arg) && assertName in arg && assertValue(arg[assertName]);
}

function hasSingleMessageProperty(
  arg: unknown
): arg is { message: UnknownObject } {
  return (
    isObject<{ message: UnknownObject }>(arg) &&
    Object.keys(arg).length === 1 &&
    isObject(arg.message)
  );
}
