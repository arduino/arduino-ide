import { injectable } from '@theia/core/shared/inversify';
import { DebugError } from '@theia/debug/lib/common/debug-service';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { nls } from '@theia/core/lib/common';

@injectable()
export class DebugSessionManager extends TheiaDebugSessionManager {
  override async start(options: DebugSessionOptions): Promise<DebugSession | undefined> {
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

          //#region "cherry-picked" from here: https://github.com/eclipse-theia/theia/commit/e6b57ba4edabf797f3b4e67bc2968cdb8cc25b1e#diff-08e04edb57cd2af199382337aaf1dbdb31171b37ae4ab38a38d36cd77bc656c7R196-R207
          if (!resolved) {
            // As per vscode API: https://code.visualstudio.com/api/references/vscode-api#DebugConfigurationProvider
            // "Returning the value 'undefined' prevents the debug session from starting.
            // Returning the value 'null' prevents the debug session from starting and opens the
            // underlying debug configuration instead."

            if (resolved === null) {
              this.debugConfigurationManager.openConfiguration();
            }
            return undefined;
          }
          //#endregion end of cherry-pick

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
  override async terminateSession(session?: DebugSession): Promise<void> {
    if (!session) {
        this.updateCurrentSession(this._currentSession);
        session = this._currentSession;
    }
    // The cortex-debug extension does not respond to close requests
    // So we simply terminate the debug session immediately
    // Alternatively the `super.terminateSession` call will terminate it after 5 seconds without a response
    await this.debug.terminateDebugSession(session!.id);
    await super.terminateSession(session);
  }
}
