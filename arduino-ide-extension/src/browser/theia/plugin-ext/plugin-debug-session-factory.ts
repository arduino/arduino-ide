import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionConnection } from '@theia/debug/lib/browser/debug-session-connection';
import { DebugConfigurationSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { PluginDebugSessionFactory as TheiaPluginDebugSessionFactory } from '@theia/plugin-ext/lib/main/browser/debug/plugin-debug-session-factory';
import { PluginDebugSession } from './plugin-debug-session';

export class PluginDebugSessionFactory extends TheiaPluginDebugSessionFactory {
  override get(
    sessionId: string,
    options: DebugConfigurationSessionOptions,
    parentSession?: DebugSession
  ): DebugSession {
    const connection = new DebugSessionConnection(
      sessionId,
      this.connectionFactory,
      this.getTraceOutputChannel()
    );

    return new PluginDebugSession(
      sessionId,
      options,
      parentSession,
      connection,
      this.terminalService,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editorManager as any,
      this.breakpoints,
      this.labelProvider,
      this.messages,
      this.fileService,
      this.terminalOptionsExt,
      this.debugContributionProvider,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.workspaceService as any
    );
  }
}
