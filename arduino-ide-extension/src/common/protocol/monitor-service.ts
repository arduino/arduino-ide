import { JsonRpcServer } from '@theia/core';
import { Board } from './boards-service';

export interface MonitorError {
    readonly message: string;
    readonly code: number
}

export interface MonitorReadEvent {
    readonly connectionId: string;
    readonly data: string;
}

export const MonitorServiceClient = Symbol('MonitorServiceClient');
export interface MonitorServiceClient {
    notifyRead(event: MonitorReadEvent): void;
    notifyError(event: MonitorError): void;
}

export const MonitorServicePath = '/services/serial-monitor';
export const MonitorService = Symbol('MonitorService');
export interface MonitorService extends JsonRpcServer<MonitorServiceClient> {
    connect(config: ConnectionConfig): Promise<{ connectionId: string }>;
    disconnect(connectionId: string): Promise<boolean>;
    send(connectionId: string, data: string | Uint8Array): Promise<void>;
    getConnectionIds(): Promise<string[]>;
}

export interface ConnectionConfig {
    readonly board: Board;
    readonly port: string;
    /**
     * Defaults to [`SERIAL`](ConnectionType#SERIAL).
     */
    readonly type?: ConnectionType;
    /**
     * Defaults to `9600`.
     */
    readonly baudRate?: number;
}

export enum ConnectionType {
    SERIAL = 0
}
