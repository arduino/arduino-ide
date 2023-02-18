import { injectable } from '@theia/core/shared/inversify';
import { DebugSessionConnection } from '@theia/debug/lib/browser/debug-session-connection';
import { DefaultDebugSessionFactory as TheiaDefaultDebugSessionFactory } from '@theia/debug/lib/browser/debug-session-contribution';
import { DebugConfigurationSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import {
  DebugAdapterPath,
  DebugChannel,
  ForwardingDebugChannel,
} from '@theia/debug/lib/common/debug-service';
import { DebugSession } from './debug-session';

@injectable()
export class DefaultDebugSessionFactory extends TheiaDefaultDebugSessionFactory {
  override get(
    sessionId: string,
    options: DebugConfigurationSessionOptions,
    parentSession?: DebugSession
  ): DebugSession {
    const connection = new DebugSessionConnection(
      sessionId,
      () =>
        new Promise<DebugChannel>((resolve) =>
          this.connectionProvider.openChannel(
            `${DebugAdapterPath}/${sessionId}`,
            (wsChannel) => {
              resolve(new ForwardingDebugChannel(wsChannel));
            },
            { reconnecting: false }
          )
        ),
      this.getTraceOutputChannel()
    );
    // patched debug session
    return new DebugSession(
      sessionId,
      options,
      parentSession,
      connection,
      this.terminalService,
      this.editorManager,
      this.breakpoints,
      this.labelProvider,
      this.messages,
      this.fileService,
      this.debugContributionProvider,
      this.workspaceService
    );
  }
}
