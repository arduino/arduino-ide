import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Programmer } from './boards-service';

export const CoreServiceClient = Symbol('CoreServiceClient');
export interface CoreServiceClient {
    notifyIndexUpdated(): void;
}

export const CoreServicePath = '/services/core-service';
export const CoreService = Symbol('CoreService');
export interface CoreService extends JsonRpcServer<CoreServiceClient> {
    compile(options: CoreService.Compile.Options): Promise<void>;
    upload(options: CoreService.Upload.Options): Promise<void>;
}

export namespace CoreService {

    export namespace Compile {
        export interface Options {
            readonly sketchUri: string;
            readonly fqbn: string;
            readonly optimizeForDebug: boolean;
        }
    }

    export namespace Upload {
        export type Options =
            Compile.Options & Readonly<{ port: string }> |
            Compile.Options & Readonly<{ programmer: Programmer }>;
    }

}
