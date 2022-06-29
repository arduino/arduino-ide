import { ApplicationError } from '@theia/core/lib/common/application-error';
import type { Location } from '@theia/core/shared/vscode-languageserver-protocol';
import type {
  Board,
  BoardUserField,
  Port,
} from '../../common/protocol/boards-service';
import type { ErrorInfo as CliErrorInfo } from '../../node/cli-error-parser';
import type { Programmer } from './boards-service';
import type { Sketch } from './sketches-service';

export const CompilerWarningLiterals = [
  'None',
  'Default',
  'More',
  'All',
] as const;
export type CompilerWarnings = typeof CompilerWarningLiterals[number];
export namespace CoreError {
  export type ErrorInfo = CliErrorInfo;
  export interface Compiler extends ErrorInfo {
    readonly message: string;
    readonly location: Location;
  }
  export namespace Compiler {
    export function is(error: ErrorInfo): error is Compiler {
      const { message, location } = error;
      return !!message && !!location;
    }
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
  ): error is ApplicationError<number, ErrorInfo[]> {
    return (
      error instanceof Error &&
      ApplicationError.is(error) &&
      Object.values(Codes).includes(error.code)
    );
  }
  function create(
    code: number
  ): ApplicationError.Constructor<number, ErrorInfo[]> {
    return ApplicationError.declare(
      code,
      (message: string, data: ErrorInfo[]) => {
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
  compile(
    options: CoreService.Compile.Options &
      Readonly<{
        exportBinaries?: boolean;
        compilerWarnings?: CompilerWarnings;
      }>
  ): Promise<void>;
  upload(options: CoreService.Upload.Options): Promise<void>;
  uploadUsingProgrammer(options: CoreService.Upload.Options): Promise<void>;
  burnBootloader(options: CoreService.Bootloader.Options): Promise<void>;
}

export namespace CoreService {
  export namespace Compile {
    export interface Options {
      readonly sketch: Sketch;
      readonly board?: Board;
      readonly optimizeForDebug: boolean;
      readonly verbose: boolean;
      readonly sourceOverride: Record<string, string>;
    }
  }

  export namespace Upload {
    export interface Options extends Compile.Options {
      readonly port?: Port;
      readonly programmer?: Programmer | undefined;
      readonly verify: boolean;
      readonly userFields: BoardUserField[];
    }
  }

  export namespace Bootloader {
    export interface Options {
      readonly board?: Board;
      readonly port?: Port;
      readonly programmer?: Programmer | undefined;
      readonly verbose: boolean;
      readonly verify: boolean;
    }
  }
}
