import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';
import { Board } from './boards-service';

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

    export namespace Upload {
        export interface Options {
            readonly uri: string;
            readonly board: Board;
            readonly port: string;
            readonly optimizeForDebug: boolean;
        }
    }

    export namespace Compile {
        export interface Options {
            readonly uri: string;
            readonly board: Board;
            readonly optimizeForDebug: boolean;
        }
    }
}
