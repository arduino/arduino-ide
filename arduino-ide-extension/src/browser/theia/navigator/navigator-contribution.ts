import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { FileNavigatorContribution as TheiaFileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { FileNavigatorPreferences } from '@theia/navigator/lib/browser/navigator-preferences';
import { OpenerService } from '@theia/core/lib/browser/opener-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import { WorkspacePreferences } from '@theia/workspace/lib/browser/workspace-preferences';

@injectable()
export class FileNavigatorContribution extends TheiaFileNavigatorContribution {
  constructor(
    @inject(FileNavigatorPreferences)
    protected override readonly fileNavigatorPreferences: FileNavigatorPreferences,
    @inject(OpenerService) protected override readonly openerService: OpenerService,
    @inject(FileNavigatorFilter)
    protected override readonly fileNavigatorFilter: FileNavigatorFilter,
    @inject(WorkspaceService)
    protected override readonly workspaceService: WorkspaceService,
    @inject(WorkspacePreferences)
    protected override readonly workspacePreferences: WorkspacePreferences
  ) {
    super(
      fileNavigatorPreferences,
      openerService,
      fileNavigatorFilter,
      workspaceService,
      workspacePreferences
    );
    this.options.defaultWidgetOptions.rank = 1;
  }

  override async initializeLayout(app: FrontendApplication): Promise<void> {
    // NOOP
  }

  override registerKeybindings(registry: KeybindingRegistry): void {
    super.registerKeybindings(registry);
    [WorkspaceCommands.FILE_RENAME, WorkspaceCommands.FILE_DELETE].forEach(
      registry.unregisterKeybinding.bind(registry)
    );
  }
}
