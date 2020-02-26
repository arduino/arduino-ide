import { DebugSessionManager } from "@theia/debug/lib/browser/debug-session-manager";
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";

export class ArduinoDebugSessionManager extends DebugSessionManager {

    start(options: DebugSessionOptions) {
        if (options.configuration.type === 'arduino' && this.sessions.find(s => s.configuration.type === 'arduino')) {
            this.messageService.info('A debug session is already running. You must stop the running session before starting a new one.')
            return Promise.resolve(undefined);
        }
        return super.start(options);
    }

}
