export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService {
    compile(options: CoreService.Compile.Options): Promise<void>;
    upload(): Promise<void>;
}

export namespace CoreService {
    export namespace Compile {
        export interface Options {
            readonly uri: string;
        }
    }
}