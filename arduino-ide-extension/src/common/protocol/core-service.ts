import { BoardUserField } from '.';
import { Board, Port } from '../../common/protocol/boards-service';
import { Programmer } from './boards-service';

export const CompilerWarningLiterals = [
  'None',
  'Default',
  'More',
  'All',
] as const;
export type CompilerWarnings = typeof CompilerWarningLiterals[number];

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
  isUploading(): Promise<boolean>;
}

export namespace CoreService {
  export namespace Compile {
    export interface Options {
      /**
       * `file` URI to the sketch folder.
       */
      readonly sketchUri: string;
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
