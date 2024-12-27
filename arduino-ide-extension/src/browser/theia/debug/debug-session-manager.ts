import { inject, injectable } from '@theia/core/shared/inversify';
import { DebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionManager as TheiaDebugSessionManager } from '@theia/debug/lib/browser/debug-session-manager';
import { DebugConfigurationSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import deepEqual from 'fast-deep-equal';

@injectable()
export class DebugSessionManager extends TheiaDebugSessionManager {
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  protected override doStart(
    sessionId: string,
    options: DebugConfigurationSessionOptions
  ): Promise<DebugSession> {
    this.syncCurrentOptions(options);
    return super.doStart(sessionId, options);
  }

  /**
   * If the debug config manager knows about the currently started options, and it's not the currently selected one, select it.
   */
  private syncCurrentOptions(options: DebugConfigurationSessionOptions): void {
    const knownConfigOptions = this.debugConfigurationManager.find(
      options.configuration,
      options.workspaceFolderUri ??
        this.workspaceService
          .tryGetRoots()
          .map((stat) => stat.resource.toString())[0]
    );
    if (
      knownConfigOptions &&
      !deepEqual(knownConfigOptions, this.debugConfigurationManager.current)
    ) {
      this.debugConfigurationManager.current = knownConfigOptions;
    }
  }
}
