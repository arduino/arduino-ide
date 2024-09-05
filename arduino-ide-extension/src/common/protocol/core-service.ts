import { ApplicationError } from '@theia/core/lib/common/application-error';
import type { CancellationToken } from '@theia/core/lib/common/cancellation';
import { nls } from '@theia/core/lib/common/nls';
import type {
  Location,
  Position,
  Range,
} from '@theia/core/shared/vscode-languageserver-protocol';
import type { CompileSummary as ApiCompileSummary } from 'vscode-arduino-api';
import type { BoardUserField, Installable } from '../../common/protocol/';
import { PortIdentifier, Programmer, isPortIdentifier } from './boards-service';
import type { IndexUpdateSummary } from './notification-service';
import type { Sketch } from './sketches-service';

export const CompilerWarningLiterals = [
  'None',
  'Default',
  'More',
  'All',
] as const;
export type CompilerWarnings = (typeof CompilerWarningLiterals)[number];
export namespace CompilerWarnings {
  export function labelOf(warning: CompilerWarnings): string {
    return CompilerWarningLabels[warning];
  }
  const CompilerWarningLabels: Record<CompilerWarnings, string> = {
    None: nls.localize('arduino/core/compilerWarnings/none', 'None'),
    Default: nls.localize('arduino/core/compilerWarnings/default', 'Default'),
    More: nls.localize('arduino/core/compilerWarnings/more', 'More'),
    All: nls.localize('arduino/core/compilerWarnings/all', 'All'),
  };
}
export namespace CoreError {
  export interface ErrorLocationRef {
    readonly message: string;
    readonly location: Location;
    readonly details?: string;
  }
  export namespace ErrorLocationRef {
    export function equals(
      left: ErrorLocationRef,
      right: ErrorLocationRef
    ): boolean {
      return (
        left.message === right.message &&
        left.details === right.details &&
        equalsLocation(left.location, right.location)
      );
    }
    function equalsLocation(left: Location, right: Location): boolean {
      return left.uri === right.uri && equalsRange(left.range, right.range);
    }
    function equalsRange(left: Range, right: Range): boolean {
      return (
        equalsPosition(left.start, right.start) &&
        equalsPosition(left.end, right.end)
      );
    }
    function equalsPosition(left: Position, right: Position): boolean {
      return left.character === right.character && left.line === right.line;
    }
  }
  export interface ErrorLocation extends ErrorLocationRef {
    /**
     * The range of the error location source from the CLI output.
     */
    readonly rangesInOutput: Range[]; // The same error might show up multiple times in the CLI output: https://github.com/arduino/arduino-cli/issues/1761
  }
  export const Codes = {
    Verify: 4001,
    Upload: 4002,
    UploadUsingProgrammer: 4003,
    BurnBootloader: 4004,
    UploadRequiresProgrammer: 4005,
  };
  export const VerifyFailed = declareCoreError(Codes.Verify);
  export const UploadFailed = declareCoreError(Codes.Upload);
  export const UploadUsingProgrammerFailed = declareCoreError(
    Codes.UploadUsingProgrammer
  );
  export const BurnBootloaderFailed = declareCoreError(Codes.BurnBootloader);
  export const UploadRequiresProgrammer = declareCoreError(
    Codes.UploadRequiresProgrammer
  );

  export function is(
    error: unknown
  ): error is ApplicationError<number, ErrorLocation[]> {
    return (
      error instanceof Error &&
      ApplicationError.is(error) &&
      Object.values(Codes).includes(error.code)
    );
  }
  function declareCoreError(
    code: number
  ): ApplicationError.Constructor<number, ErrorLocation[]> {
    return ApplicationError.declare(
      code,
      (message: string, data: ErrorLocation[]) => {
        return {
          data,
          message,
        };
      }
    );
  }
}

export interface InstalledPlatformReference {
  readonly id: string;
  readonly version: Installable.Version;
  /**
   * Absolute filesystem path.
   */
  readonly installDir: string;
  readonly packageUrl: string;
}

export interface ExecutableSectionSize {
  readonly name: string;
  readonly size: number;
  readonly maxSize: number;
}

export interface CompileSummary {
  readonly buildPath: string;
  /**
   * To be compatible with the `vscode-arduino-tools` API.
   * @deprecated Use `buildPath` instead. Use Theia or VS Code URI to convert to an URI string on the client side.
   */
  readonly buildOutputUri: string;
  readonly usedLibraries: ApiCompileSummary['usedLibraries'];
  readonly executableSectionsSize: ExecutableSectionSize[];
  readonly boardPlatform?: InstalledPlatformReference | undefined;
  readonly buildPlatform?: InstalledPlatformReference | undefined;
  readonly buildProperties: string[];
}

export function isCompileSummary(arg: unknown): arg is CompileSummary {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    (<CompileSummary>arg).buildPath !== undefined &&
    typeof (<CompileSummary>arg).buildPath === 'string' &&
    (<CompileSummary>arg).buildOutputUri !== undefined &&
    typeof (<CompileSummary>arg).buildOutputUri === 'string' &&
    (<CompileSummary>arg).executableSectionsSize !== undefined &&
    Array.isArray((<CompileSummary>arg).executableSectionsSize) &&
    (<CompileSummary>arg).usedLibraries !== undefined &&
    Array.isArray((<CompileSummary>arg).usedLibraries) &&
    (<CompileSummary>arg).buildProperties !== undefined &&
    Array.isArray((<CompileSummary>arg).buildProperties)
  );
}

export interface UploadResponse {
  readonly portAfterUpload: PortIdentifier;
}
export function isUploadResponse(arg: unknown): arg is UploadResponse {
  return (
    Boolean(arg) &&
    typeof arg === 'object' &&
    isPortIdentifier((<UploadResponse>arg).portAfterUpload)
  );
}

export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService {
  compile(
    options: CoreService.Options.Compile,
    cancellationToken?: CancellationToken
  ): Promise<void>;
  upload(
    options: CoreService.Options.Upload,
    cancellationToken?: CancellationToken
  ): Promise<UploadResponse>;
  burnBootloader(
    options: CoreService.Options.Bootloader,
    cancellationToken?: CancellationToken
  ): Promise<void>;
  /**
   * Refreshes the underling core gRPC client for the Arduino CLI.
   */
  refresh(): Promise<void>;
  /**
   * Updates the index of the given index types and refreshes (`init`) the underlying core gRPC client.
   * If `types` is empty, only the refresh part will be executed.
   */
  updateIndex({ types }: { types: IndexType[] }): Promise<void>;
  /**
   * If the IDE2 detects invalid or missing indexes on core client init,
   * IDE2 tries to update the indexes before the first frontend connects.
   * Use this method to determine whether the backend has already updated
   * the indexes before updating them.
   *
   * If yes, the connected frontend can update the local storage with the most
   * recent index update date-time for a particular index type,
   * and IDE2 can avoid the double indexes update.
   */
  indexUpdateSummaryBeforeInit(): Promise<Readonly<IndexUpdateSummary>>;
}

export const IndexTypeLiterals = ['platform', 'library'] as const;
export type IndexType = (typeof IndexTypeLiterals)[number];
export namespace IndexType {
  export function is(arg: unknown): arg is IndexType {
    return (
      typeof arg === 'string' && IndexTypeLiterals.includes(arg as IndexType)
    );
  }
  export const All: IndexType[] = IndexTypeLiterals.filter(is);
}

export namespace CoreService {
  export namespace Options {
    export interface Base {
      readonly fqbn?: string | undefined;
      readonly verbose: boolean; // TODO: (API) why not optional with a default false?
      readonly progressId?: string;
    }
    export interface SketchBased {
      readonly sketch: Sketch;
    }
    export interface BoardBased {
      readonly port?: PortIdentifier;
      readonly programmer?: Programmer | undefined;
      /**
       * For the _Verify after upload_ setting.
       */
      readonly verify: boolean; // TODO: (API) why not optional with false as the default value?
    }
    export interface Compile extends Base, SketchBased {
      readonly optimizeForDebug: boolean; // TODO: (API) make this optional
      readonly sourceOverride: Record<string, string>; // TODO: (API) make this optional
      readonly exportBinaries?: boolean;
      readonly compilerWarnings?: CompilerWarnings;
    }
    export interface Upload extends Base, SketchBased, BoardBased {
      readonly userFields: BoardUserField[];
      readonly usingProgrammer?: boolean;
    }
    export interface Bootloader extends Base, BoardBased {}
  }
}
