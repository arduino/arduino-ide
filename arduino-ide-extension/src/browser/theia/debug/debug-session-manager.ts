import { injectable } from 'inversify';
import { DebugError } from '@theia/debug/lib/common/debug-service';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';

@injectable()
export class DebugSessionManager extends TheiaDebugSessionManager {

    async start(options: DebugSessionOptions): Promise<DebugSession | undefined> {
        return this.progressService.withProgress('Start...', 'debug', async () => {
            try {
                // Only save when dirty. To avoid saving temporary sketches.
                // This is a quick fix for not saving the editor when there are no dirty editors.
                // // https://github.com/bcmi-labs/arduino-editor/pull/172#issuecomment-741831888
                if (this.shell.canSaveAll()) {
                    await this.shell.saveAll();
                }
                await this.fireWillStartDebugSession();
                const resolved = await this.resolveConfiguration(options);

                // preLaunchTask isn't run in case of auto restart as well as postDebugTask
                if (!options.configuration.__restart) {
                    const taskRun = await this.runTask(options.workspaceFolderUri, resolved.configuration.preLaunchTask, true);
                    if (!taskRun) {
                        return undefined;
                    }
                }

                const sessionId = await this.debug.createDebugSession(resolved.configuration);
                return this.doStart(sessionId, resolved);
            } catch (e) {
                if (DebugError.NotFound.is(e)) {
                    this.messageService.error(`The debug session type "${e.data.type}" is not supported.`);
                    return undefined;
                }

                this.messageService.error('There was an error starting the debug session, check the logs for more details.');
                console.error('Error starting the debug session', e);
                throw e;
            }
        });
    }

}
