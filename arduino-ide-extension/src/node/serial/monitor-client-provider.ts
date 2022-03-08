import * as grpc from '@grpc/grpc-js';
import { injectable } from '@theia/core/shared/inversify';
import { MonitorServiceClient } from '../cli-protocol/cc/arduino/cli/monitor/v1/monitor_grpc_pb';
import * as monitorGrpcPb from '../cli-protocol/cc/arduino/cli/monitor/v1/monitor_grpc_pb';
import { GrpcClientProvider } from '../grpc-client-provider';

@injectable()
export class MonitorClientProvider extends GrpcClientProvider<MonitorServiceClient> {
  createClient(port: string | number): MonitorServiceClient {
    // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
    const MonitorServiceClient = grpc.makeClientConstructor(
      // @ts-expect-error: ignore
      monitorGrpcPb['cc.arduino.cli.monitor.v1.MonitorService'],
      'MonitorServiceService'
    ) as any;
    return new MonitorServiceClient(
      `localhost:${port}`,
      grpc.credentials.createInsecure(),
      this.channelOptions
    );
  }

  close(client: MonitorServiceClient): void {
    client.close();
  }
}
