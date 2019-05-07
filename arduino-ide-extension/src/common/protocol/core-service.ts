export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService {
    compile(options: CoreService.Compile.Options): Promise<void>;
    upload(options: CoreService.Upload.Options): Promise<void>;
}

export namespace CoreService {

    export namespace Upload {
        export interface Options {
            readonly uri: string;
        }
    }

    export namespace Compile {
        export interface Options {
            readonly uri: string;
        }
    }
}