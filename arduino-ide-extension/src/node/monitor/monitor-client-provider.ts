import * as grpc from '@grpc/grpc-js';
import { injectable } from 'inversify';
import { MonitorClient } from '../cli-protocol/monitor/monitor_grpc_pb';
import * as monitorGrpcPb from '../cli-protocol/monitor/monitor_grpc_pb';
import { GrpcClientProvider } from '../grpc-client-provider';

@injectable()
export class MonitorClientProvider extends GrpcClientProvider<MonitorClient> {

    createClient(port: string | number): MonitorClient {
        // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
        // @ts-ignore
        const MonitorClient = grpc.makeClientConstructor(monitorGrpcPb['cc.arduino.cli.monitor.Monitor'], 'MonitorService') as any;
        return new MonitorClient(`localhost:${port}`, grpc.credentials.createInsecure(), this.channelOptions);
    }

    close(client: MonitorClient): void {
        client.close();
    }

}
