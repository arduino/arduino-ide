import { v4 } from 'uuid';
import { Chance } from 'chance';
import { ClientDuplexStream } from '@grpc/grpc-js';
import { TextDecoder, TextEncoder } from 'util';
import { injectable, inject, named } from 'inversify';
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { ILogger, Disposable, DisposableCollection } from '@theia/core';
import { MonitorService, MonitorServiceClient, MonitorConfig, MonitorError } from '../../common/protocol/monitor-service';
import { StreamingOpenReq, StreamingOpenResp, MonitorConfig as GrpcMonitorConfig } from '../cli-protocol/monitor/monitor_pb';
import { MonitorClientProvider } from './monitor-client-provider';
import { Board, Port } from '../../common/protocol/boards-service';

export interface MonitorDuplex {
    readonly toDispose: Disposable;
    readonly duplex: ClientDuplexStream<StreamingOpenReq, StreamingOpenResp>;
}

interface ErrorWithCode extends Error {
    readonly code: number;
}
namespace ErrorWithCode {
    export function is(error: Error & { code?: number }): error is ErrorWithCode {
        return typeof error.code === 'number';
    }
    export function toMonitorError(error: Error, connectionId: string, config: MonitorConfig): MonitorError | undefined {
        if (is(error)) {
            const { code, message } = error;
            // TODO: apply a regex on the `message`, and use enums instead of a numbers for the error codes.
            if (code === 1 && message === 'Cancelled on client') {
                return {
                    connectionId,
                    message,
                    code: MonitorError.ErrorCodes.CLIENT_CANCEL,
                    config
                };
            }
            if (code === 2) {
                switch (message) {
                    case 'device not configured': {
                        return {
                            connectionId,
                            message,
                            code: MonitorError.ErrorCodes.DEVICE_NOT_CONFIGURED,
                            config
                        }
                    }
                    case 'error opening serial monitor: Serial port busy': {
                        return {
                            connectionId,
                            message,
                            code: MonitorError.ErrorCodes.DEVICE_BUSY,
                            config
                        }
                    }
                    case 'interrupted system call': {
                        return {
                            connectionId,
                            message,
                            code: MonitorError.ErrorCodes.interrupted_system_call,
                            config
                        }
                    }
                }
            }
            console.warn(`Unhandled error with code:`, error);
        }
        return undefined;
    }
}

@injectable()
export class MonitorServiceImpl implements MonitorService {

    @inject(ILogger)
    @named('monitor-service')
    protected readonly logger: ILogger;

    @inject(MonitorClientProvider)
    protected readonly monitorClientProvider: MonitorClientProvider;

    protected client?: MonitorServiceClient;
    protected readonly connections = new Map<string, MonitorDuplex>();

    setClient(client: MonitorServiceClient | undefined): void {
        this.client = client;
    }

    dispose(): void {
        this.logger.info('>>> Disposing monitor service...');
        for (const [connectionId, duplex] of this.connections.entries()) {
            this.doDisconnect(connectionId, duplex);
        }
        this.logger.info('<<< Disposing monitor service...');
        this.client = undefined;
    }

    async connect(config: MonitorConfig): Promise<{ connectionId: string }> {
        this.logger.info(`>>> Creating serial monitor connection for ${Board.toString(config.board)} on port ${Port.toString(config.port)}...`);
        const client = await this.monitorClientProvider.client;
        const duplex = client.streamingOpen();
        const connectionId = `${new Chance(v4()).animal().replace(/\s+/g, '-').toLowerCase()}-monitor-connection`;
        const toDispose = new DisposableCollection(
            Disposable.create(() => this.disconnect(connectionId))
        );

        duplex.on('error', ((error: Error) => {
            if (ErrorWithCode.is(error)) {
                const monitorError = ErrorWithCode.toMonitorError(error, connectionId, config);
                if (monitorError) {
                    if (this.client) {
                        this.client.notifyError(monitorError);
                    }
                    // Do not log the error, it was expected. The client will take care of the rest.
                    if (monitorError.code === MonitorError.ErrorCodes.interrupted_system_call) {
                        console.log('jajjajaja');
                        if (!toDispose.disposed) {
                            toDispose.dispose();
                        }
                    }
                    return;
                }
            }
            if (error.message === 'interrupted system call') {
                this.logger.info('TODO: reduce to debug, INTERRUPTED SYSTEM CALL');
                return; // Continue.
            }
            if (!toDispose.disposed) {
                toDispose.dispose();
            }
            this.logger.error(`Error occurred for connection ${connectionId}.`, error);
        }).bind(this));

        duplex.on('data', ((resp: StreamingOpenResp) => {
            if (this.client) {
                const raw = resp.getData();
                const data = typeof raw === 'string' ? raw : new TextDecoder('utf8').decode(raw);
                this.client.notifyRead({ connectionId, data });
            }
        }).bind(this));

        const { type, port } = config;
        const req = new StreamingOpenReq();
        const monitorConfig = new GrpcMonitorConfig();
        monitorConfig.setType(this.mapType(type));
        monitorConfig.setTarget(port.address);
        if (config.baudRate !== undefined) {
            monitorConfig.setAdditionalconfig(Struct.fromJavaScript({ 'BaudRate': config.baudRate }));
        }
        req.setMonitorconfig(monitorConfig);

        return new Promise<{ connectionId: string }>(resolve => {
            duplex.write(req, () => {
                this.connections.set(connectionId, { toDispose, duplex });
                this.logger.info(`<<< Serial monitor connection created for ${Board.toString(config.board)} on port ${Port.toString(config.port)}. ID: [${connectionId}]`);
                resolve({ connectionId });
            });
        });
    }

    async disconnect(connectionId: string): Promise<boolean> {
        this.logger.info(`>>> Received disconnect request for connection: ${connectionId}`);
        const disposable = this.connections.get(connectionId);
        if (!disposable) {
            this.logger.warn(`<<< No connection was found for ID: ${connectionId}`);
            return false;
        }
        const result = await this.doDisconnect(connectionId, disposable);
        if (result) {
            this.logger.info(`<<< Successfully disconnected from ${connectionId}.`);
        } else {
            this.logger.info(`<<< Could not disconnected from ${connectionId}.`);
        }
        return result;
    }

    protected async doDisconnect(connectionId: string, monitorDuplex: MonitorDuplex): Promise<boolean> {
        const { duplex } = monitorDuplex;
        this.logger.info(`>>> Disposing monitor connection: ${connectionId}...`);
        try {
            duplex.cancel();
            this.connections.delete(connectionId);
            this.logger.info(`<<< Connection disposed: ${connectionId}.`);
            return true;
        } catch (e) {
            this.logger.error(`<<< Error occurred when disposing monitor connection: ${connectionId}. ${e}`);
            return false;
        }
    }

    async send(connectionId: string, data: string): Promise<void> {
        const duplex = this.duplex(connectionId);
        if (duplex) {
            const req = new StreamingOpenReq();
            req.setData(new TextEncoder().encode(data));
            return new Promise<void>(resolve => duplex.duplex.write(req, resolve));
        } else {
            throw new Error(`No connection with ID: ${connectionId}.`);
        }
    }

    protected mapType(type?: MonitorConfig.ConnectionType): GrpcMonitorConfig.TargetType {
        switch (type) {
            case MonitorConfig.ConnectionType.SERIAL: return GrpcMonitorConfig.TargetType.SERIAL;
            default: return GrpcMonitorConfig.TargetType.SERIAL;
        }
    }

    protected duplex(connectionId: string): MonitorDuplex | undefined {
        const monitorClient = this.connections.get(connectionId);
        if (!monitorClient) {
            this.logger.warn(`Could not find monitor client for connection ID: ${connectionId}`);
        }
        return monitorClient;
    }

}
