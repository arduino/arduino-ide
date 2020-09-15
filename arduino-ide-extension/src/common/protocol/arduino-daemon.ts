export const ArduinoDaemonPath = '/services/arduino-daemon';
export const ArduinoDaemon = Symbol('ArduinoDaemon');
export interface ArduinoDaemon {
    isRunning(): Promise<boolean>;
}
