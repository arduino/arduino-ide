import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const ArduinoDaemonClient = Symbol('ArduinoDaemonClient');
export interface ArduinoDaemonClient {
    notifyStarted(): void;
    notifyStopped(): void;
}

export const ArduinoDaemonPath = '/services/arduino-daemon';
export const ArduinoDaemon = Symbol('ArduinoDaemon');
export interface ArduinoDaemon extends JsonRpcServer<ArduinoDaemonClient> {
    isRunning(): Promise<boolean>;
}
