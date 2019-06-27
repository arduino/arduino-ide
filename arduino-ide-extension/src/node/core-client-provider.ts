import { Instance } from './cli-protocol/commands/common_pb';
import { ArduinoCoreClient } from './cli-protocol/commands/commands_grpc_pb';

export const CoreClientProviderPath = '/services/core-client-provider';
export const CoreClientProvider = Symbol('CoreClientProvider');
export interface CoreClientProvider {
    getClient(workspaceRootOrResourceUri?: string): Promise<Client | undefined>;
}

export interface Client {
    readonly client: ArduinoCoreClient;
    readonly instance: Instance;
}