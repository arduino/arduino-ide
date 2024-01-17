import { credentials, makeClientConstructor } from '@grpc/grpc-js';
import * as commandsGrpcPb from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';
import { ArduinoCoreServiceClient } from './cli-protocol/cc/arduino/cli/commands/v1/commands_grpc_pb';

export interface CreateClientOptions {
  /**
   * The port to the Arduino CLI daemon.
   */
  readonly port: number;
  /**
   * Defaults to `'localhost'`.
   */
  readonly host?: string;

  /**
   * gRCP channel options. Defaults to `createDefaultChannelOptions` with `'0.0.0'` `appVersion`
   */
  readonly channelOptions?: Record<string, unknown>;
}

export function createDefaultChannelOptions(
  appVersion = '0.0.0'
): Record<string, unknown> {
  return {
    'grpc.max_send_message_length': 512 * 1024 * 1024,
    'grpc.max_receive_message_length': 512 * 1024 * 1024,
    'grpc.primary_user_agent': `arduino-ide/${appVersion}`,
  };
}

export function createArduinoCoreServiceClient(
  options: CreateClientOptions
): ArduinoCoreServiceClient {
  const {
    port,
    host = 'localhost',
    channelOptions = createDefaultChannelOptions(),
  } = options;
  const address = `${host}:${port}`;
  // https://github.com/agreatfool/grpc_tools_node_protoc_ts/blob/master/doc/grpcjs_support.md#usage
  const ArduinoCoreServiceClient = makeClientConstructor(
    // @ts-expect-error: ignore
    commandsGrpcPb['cc.arduino.cli.commands.v1.ArduinoCoreService'],
    'ArduinoCoreServiceService'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  const client = new ArduinoCoreServiceClient(
    address,
    credentials.createInsecure(),
    channelOptions
  ) as ArduinoCoreServiceClient;
  return client;
}
