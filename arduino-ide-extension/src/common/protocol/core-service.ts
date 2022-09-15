import { nls } from '@theia/core/lib/common/nls';
import { ApplicationError } from '@theia/core/lib/common/application-error';
import type {
  Location,
  Range,
  Position,
} from '@theia/core/shared/vscode-languageserver-protocol';
import type {
  BoardUserField,
  Port,
} from '../../common/protocol/boards-service';
import type { Programmer } from './boards-service';
import type { Sketch } from './sketches-service';

export const CompilerWarningLiterals = [
  'None',
  'Default',
  'More',
  'All',
] as const;
export type CompilerWarnings = typeof CompilerWarningLiterals[number];
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
  };
  export const VerifyFailed = create(Codes.Verify);
  export const UploadFailed = create(Codes.Upload);
  export const UploadUsingProgrammerFailed = create(
    Codes.UploadUsingProgrammer
  );
  export const BurnBootloaderFailed = create(Codes.BurnBootloader);
  export function is(
    error: unknown
  ): error is ApplicationError<number, ErrorLocation[]> {
    return (
      error instanceof Error &&
      ApplicationError.is(error) &&
      Object.values(Codes).includes(error.code)
    );
  }
  function create(
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

export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService {
  compile(options: CoreService.Options.Compile): Promise<void>;
  upload(options: CoreService.Options.Upload): Promise<void>;
  burnBootloader(options: CoreService.Options.Bootloader): Promise<void>;
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
      readonly port?: Port;
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
