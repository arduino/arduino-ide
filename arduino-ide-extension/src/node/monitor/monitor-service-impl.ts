import { v4 } from 'uuid';
import * as grpc from '@grpc/grpc-js';
import { TextDecoder, TextEncoder } from 'util';
import { injectable, inject, named } from 'inversify';
import { ILogger, Disposable, DisposableCollection } from '@theia/core';
import { MonitorService, MonitorServiceClient, ConnectionConfig, ConnectionType } from '../../common/protocol/monitor-service';
import { StreamingOpenReq, StreamingOpenResp, MonitorConfig } from '../cli-protocol/monitor/monitor_pb';
import { MonitorClientProvider } from './monitor-client-provider';
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export interface MonitorDuplex {
    readonly toDispose: Disposable;
    readonly duplex: grpc.ClientDuplexStream<StreamingOpenReq, StreamingOpenResp>;
}

type ErrorCode = { code: number };
type MonitorError = Error & ErrorCode;
namespace MonitorError {

    export function is(error: Error & Partial<ErrorCode>): error is MonitorError {
        return typeof error.code === 'number';
    }

    /**
     * The frontend has refreshed the browser, for instance.
     */
    export function isClientCancelledError(error: MonitorError): boolean {
        return error.code === 1 && error.message === 'Cancelled on client';
    }

    /**
     * When detaching a physical device when the duplex channel is still opened.
     */
    export function isDeviceNotConfiguredError(error: MonitorError): boolean {
        return error.code === 2 && error.message === 'device not configured';
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
        for (const [connectionId, duplex] of this.connections.entries()) {
            this.doDisconnect(connectionId, duplex);
        }
    }

    async getConnectionIds(): Promise<string[]> {
        return Array.from(this.connections.keys());
    }

    async connect(config: ConnectionConfig): Promise<{ connectionId: string }> {
        const client = await this.monitorClientProvider.client;
        const duplex = client.streamingOpen();
        const connectionId = v4();
        const toDispose = new DisposableCollection(
            Disposable.create(() => this.disconnect(connectionId))
        );

        duplex.on('error', ((error: Error) => {
            if (MonitorError.is(error) && (
                MonitorError.isClientCancelledError(error)
                || MonitorError.isDeviceNotConfiguredError(error)
            )) {
                if (this.client) {
                    this.client.notifyError(error);
                }
            }
            this.logger.error(`Error occurred for connection ${connectionId}.`, error);
            toDispose.dispose();
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
        const monitorConfig = new MonitorConfig();
        monitorConfig.setType(this.mapType(type));
        monitorConfig.setTarget(port);
        if (config.baudRate !== undefined) {
            const obj = google_protobuf_struct_pb.Struct.fromJavaScript({ 'BaudRate': config.baudRate });
            monitorConfig.setAdditionalconfig(obj);
        }
        req.setMonitorconfig(monitorConfig);

        return new Promise<{ connectionId: string }>(resolve => {
            duplex.write(req, () => {
                this.connections.set(connectionId, { toDispose, duplex });
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

    protected mapType(type?: ConnectionType): MonitorConfig.TargetType {
        switch (type) {
            case ConnectionType.SERIAL: return MonitorConfig.TargetType.SERIAL;
            default: return MonitorConfig.TargetType.SERIAL;
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
