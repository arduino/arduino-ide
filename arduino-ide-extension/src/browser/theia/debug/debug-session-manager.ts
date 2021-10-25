import { injectable } from 'inversify';
import { DebugError } from '@theia/debug/lib/common/debug-service';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { nls } from '@theia/core/lib/browser/nls';

@injectable()
export class DebugSessionManager extends TheiaDebugSessionManager {
  async start(options: DebugSessionOptions): Promise<DebugSession | undefined> {
    return this.progressService.withProgress(
      nls.localize('theia/debug/start', 'Start...'),
      'debug',
      async () => {
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
            const taskRun = await this.runTask(
              options.workspaceFolderUri,
              resolved.configuration.preLaunchTask,
              true
            );
            if (!taskRun) {
              return undefined;
            }
          }

          const sessionId = await this.debug.createDebugSession(
            resolved.configuration
          );
          return this.doStart(sessionId, resolved);
        } catch (e) {
          if (DebugError.NotFound.is(e)) {
            this.messageService.error(
              nls.localize(
                'theia/debug/typeNotSupported',
                'The debug session type "{0}" is not supported.',
                e.data.type
              )
            );
            return undefined;
          }

          this.messageService.error(
            nls.localize(
              'theia/debug/startError',
              'There was an error starting the debug session, check the logs for more details.'
            )
          );
          console.error('Error starting the debug session', e);
          throw e;
        }
      }
    );
  }
  async terminateSessions(): Promise<void> {
    await super.terminateSessions();
    this.destroy(this.currentSession?.id);
  }
}
