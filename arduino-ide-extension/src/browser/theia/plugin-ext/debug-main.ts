import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { DebuggerDescription } from '@theia/debug/lib/common/debug-service';
import { DebugMainImpl as TheiaDebugMainImpl } from '@theia/plugin-ext/lib/main/browser/debug/debug-main';
import { PluginDebugAdapterContribution } from '@theia/plugin-ext/lib/main/browser/debug/plugin-debug-adapter-contribution';
import { PluginDebugSessionFactory } from './plugin-debug-session-factory';

export class DebugMainImpl extends TheiaDebugMainImpl {
  override async $registerDebuggerContribution(
    description: DebuggerDescription
  ): Promise<void> {
    const debugType = description.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _this = <any>this;
    const terminalOptionsExt = await _this.debugExt.$getTerminalCreationOptions(
      debugType
    );

    if (_this.toDispose.disposed) {
      return;
    }

    const debugSessionFactory = new PluginDebugSessionFactory(
      _this.terminalService,
      _this.editorManager,
      _this.breakpointsManager,
      _this.labelProvider,
      _this.messages,
      _this.outputChannelManager,
      _this.debugPreferences,
      async (sessionId: string) => {
        const connection = await _this.connectionMain.ensureConnection(
          sessionId
        );
        return connection;
      },
      _this.fileService,
      terminalOptionsExt,
      _this.debugContributionProvider,
      _this.workspaceService
    );

    const toDispose = new DisposableCollection(
      Disposable.create(() => _this.debuggerContributions.delete(debugType))
    );
    _this.debuggerContributions.set(debugType, toDispose);
    toDispose.pushAll([
      _this.pluginDebugService.registerDebugAdapterContribution(
        new PluginDebugAdapterContribution(
          description,
          _this.debugExt,
          _this.pluginService
        )
      ),
      _this.sessionContributionRegistrator.registerDebugSessionContribution({
        debugType: description.type,
        debugSessionFactory: () => debugSessionFactory,
      }),
    ]);
    _this.toDispose.push(
      Disposable.create(() => this.$unregisterDebuggerConfiguration(debugType))
    );
  }
}
