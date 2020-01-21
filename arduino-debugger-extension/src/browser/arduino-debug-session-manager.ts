import { DebugSessionManager } from "@theia/debug/lib/browser/debug-session-manager";
import { DebugSessionOptions } from "@theia/debug/lib/browser/debug-session-options";
import { DebugSession } from "@theia/debug/lib/browser/debug-session";

export class ArduinoDebugSessionManager extends DebugSessionManager {

    static readonly COOL_DOWN_TIME = 5000;

    protected arduinoSession?: Promise<DebugSession | undefined>;
    protected lastSessionStopTime?: DOMHighResTimeStamp;

    start(options: DebugSessionOptions) {
        if (options.configuration.type === 'arduino') {
            if (this.arduinoSession) {
                this.messageService.info('A debug session is already running. You must stop the running session before starting a new one.')
                return Promise.resolve(undefined);
            }
            const superStart = super.start.bind(this);
            const promise = (async resolve => {
                if (this.lastSessionStopTime) {
                    const now = performance.now();
                    if (now - this.lastSessionStopTime < ArduinoDebugSessionManager.COOL_DOWN_TIME) {
                        const waitTime = ArduinoDebugSessionManager.COOL_DOWN_TIME - Math.max(now - this.lastSessionStopTime, 0);
                        if (waitTime > 2000) {
                            const userWaitTime = Math.round(waitTime / 100) / 10;
                            this.messageService.info(`The previous debug session is cooling down. Waiting ${userWaitTime} seconds before starting a new session...`)
                        }
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
                return superStart(options);
            })();
            this.arduinoSession = promise;
            promise.then(session => {
                if (!session)
                    this.arduinoSession = undefined;
            });
            return promise;
        }
        return super.start(options);
    }

    destroy(sessionId?: string): void {
        if (this.arduinoSession) {
            this.arduinoSession.then(session => {
                if (session && sessionId === session.id) {
                    this.arduinoSession = undefined;
                    this.lastSessionStopTime = performance.now();
                }
            })
        }
        super.destroy(sessionId);
    }

}
