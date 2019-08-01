import * as grpc from '@grpc/grpc-js';
import { injectable, postConstruct } from 'inversify';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { MonitorClient } from '../cli-protocol/monitor/monitor_grpc_pb';

@injectable()
export class MonitorClientProvider {

    readonly deferred = new Deferred<MonitorClient>();

    @postConstruct()
    protected init(): void {
        this.deferred.resolve(new MonitorClient('localhost:50051', grpc.credentials.createInsecure()));
    }

    get client(): Promise<MonitorClient> {
        return this.deferred.promise;
    }

}
