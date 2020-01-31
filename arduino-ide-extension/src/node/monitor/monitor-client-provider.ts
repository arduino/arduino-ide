import * as grpc from '@grpc/grpc-js';
import { injectable } from 'inversify';
import { MonitorClient } from '../cli-protocol/monitor/monitor_grpc_pb';
import { GrpcClientProvider } from '../grpc-client-provider';

@injectable()
export class MonitorClientProvider extends GrpcClientProvider<MonitorClient> {

    createClient(port: string | number): MonitorClient {
        return new MonitorClient(`localhost:${port}`, grpc.credentials.createInsecure());
    }

    close(client: MonitorClient): void {
        client.close();
    }

}
