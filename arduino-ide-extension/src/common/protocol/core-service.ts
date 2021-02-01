import { Programmer } from './boards-service';

export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService {
    compile(options: CoreService.Compile.Options & Readonly<{ exportBinaries: boolean }>): Promise<void>;
    upload(options: CoreService.Upload.Options): Promise<void>;
    uploadUsingProgrammer(options: CoreService.Upload.Options): Promise<void>;
    burnBootloader(options: CoreService.Bootloader.Options): Promise<void>;
}

export namespace CoreService {

    export namespace Compile {
        export interface Options {
            readonly sketchUri: string;
            readonly fqbn?: string | undefined;
            readonly optimizeForDebug: boolean;
            readonly verbose: boolean;
        }
    }

    export namespace Upload {
        export interface Options extends Compile.Options {
            readonly port?: string | undefined;
            readonly programmer?: Programmer | undefined;
            readonly verify: boolean;
        }
    }

    export namespace Bootloader {
        export interface Options {
            readonly fqbn?: string | undefined;
            readonly port?: string | undefined;
            readonly programmer?: Programmer | undefined;
            readonly verbose: boolean;
            readonly verify: boolean;
        }
    }

}
