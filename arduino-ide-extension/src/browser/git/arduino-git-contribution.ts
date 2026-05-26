import { inject, injectable } from '@theia/core/shared/inversify';
import {
  CommandContribution,
  CommandRegistry,
} from '@theia/core/lib/common/command';
import {
  MenuContribution,
  MenuModelRegistry,
} from '@theia/core/lib/common/menu';
import { MessageService } from '@theia/core/lib/common/message-service';
import { Emitter } from '@theia/core/lib/common/event';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import {
  QuickInputService,
  QuickPickItem,
} from '@theia/core/lib/browser/quick-input/quick-input-service';
import { codicon } from '@theia/core/lib/browser';
import {
  ConfirmDialog,
  Dialog,
  SingleTextInputDialog,
} from '@theia/core/lib/browser/dialogs';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ScmService } from '@theia/scm/lib/browser/scm-service';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import {
  ScmResource,
  ScmResourceGroup,
} from '@theia/scm/lib/browser/scm-provider';
import { ScmTreeWidget } from '@theia/scm/lib/browser/scm-tree-widget';
import {
  GitBranch,
  GitRemote,
  GitService,
  GitSyncResult,
} from '../../common/protocol/git-service';
import { SketchesService } from '../../common/protocol/sketches-service';
import { ArduinoScmProvider } from './arduino-scm-provider';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { ArduinoMenus } from '../menu/arduino-menus';
import { nls } from '@theia/core/lib/common/nls';
import debounce from 'lodash.debounce';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../sketches-service-client-impl';

type GitCommandResource =
  | ScmResource
  | ScmResourceGroup
  | string
  | ScmResource[]
  | ScmResourceGroup[]
  | string[];

export namespace ArduinoGitCommands {
  export const GIT_SOURCE_CONTROL = {
    id: 'arduino-git.sourceControl',
    label: nls.localize('arduino/git/sourceControl', 'Git: Source Control'),
  };
  export const GIT_INIT = {
    id: 'arduino-git.init',
    label: nls.localize('arduino/git/init', 'Initialize Git Repository'),
  };
  export const GIT_COMMIT = {
    id: 'arduino-git.commit',
    label: nls.localize('arduino/git/commit', 'Git: Commit'),
  };
  export const GIT_COMMIT_OPTIONS = {
    id: 'arduino-git.commitOptions',
    label: nls.localize('arduino/git/commitOptions', 'Git: Commit Options'),
  };
  export const GIT_COMMIT_AND_PUSH = {
    id: 'arduino-git.commitAndPush',
    label: nls.localize('arduino/git/commitAndPush', 'Git: Commit and Push'),
  };
  export const GIT_STAGE_ALL = {
    id: 'arduino-git.stageAll',
    label: nls.localize('arduino/git/stageAll', 'Git: Stage All Changes'),
    iconClass: codicon('add'),
  };
  export const GIT_STAGE_UNTRACKED_ALL = {
    id: 'arduino-git.stageUntrackedAll',
    label: nls.localize(
      'arduino/git/stageUntrackedAll',
      'Git: Stage All Untracked Files'
    ),
    iconClass: codicon('add'),
  };
  export const GIT_UNSTAGE_ALL = {
    id: 'arduino-git.unstageAll',
    label: nls.localize('arduino/git/unstageAll', 'Git: Unstage All Changes'),
    iconClass: codicon('remove'),
  };
  export const GIT_DISCARD_ALL = {
    id: 'arduino-git.discardAll',
    label: nls.localize('arduino/git/discardAll', 'Git: Discard All Changes'),
    iconClass: codicon('discard'),
  };
  export const GIT_DELETE_UNTRACKED_ALL = {
    id: 'arduino-git.deleteUntrackedAll',
    label: nls.localize(
      'arduino/git/deleteUntrackedAll',
      'Git: Delete All Untracked Files'
    ),
    iconClass: codicon('trash'),
  };
  export const GIT_PULL = {
    id: 'arduino-git.pull',
    label: nls.localize('arduino/git/pull', 'Git: Pull'),
  };
  export const GIT_PUSH = {
    id: 'arduino-git.push',
    label: nls.localize('arduino/git/push', 'Git: Push'),
  };
  export const GIT_PUBLISH_BRANCH = {
    id: 'arduino-git.publishBranch',
    label: nls.localize('arduino/git/publishBranch', 'Git: Publish Branch'),
  };
  export const GIT_ADD_REMOTE = {
    id: 'arduino-git.addRemote',
    label: nls.localize('arduino/git/addRemote', 'Git: Add Remote Origin'),
  };
  export const GIT_CHECKOUT = {
    id: 'arduino-git.checkout',
    label: nls.localize('arduino/git/checkout', 'Git: Checkout Branch'),
  };
  export const GIT_CREATE_BRANCH = {
    id: 'arduino-git.createBranch',
    label: nls.localize('arduino/git/createBranch', 'Git: Create Branch'),
  };
  export const GIT_REFRESH = {
    id: 'arduino-git.refresh',
    label: nls.localize('arduino/git/refresh', 'Git: Refresh Status'),
  };
  export const GIT_STAGE_FILE = {
    id: 'arduino-git.stageFile',
    label: nls.localize('arduino/git/stageFile', 'Git: Stage File'),
    iconClass: codicon('add'),
  };
  export const GIT_UNSTAGE_FILE = {
    id: 'arduino-git.unstageFile',
    label: nls.localize('arduino/git/unstageFile', 'Git: Unstage File'),
    iconClass: codicon('remove'),
  };
  export const GIT_DISCARD_FILE = {
    id: 'arduino-git.discardFile',
    label: nls.localize('arduino/git/discardFile', 'Git: Discard Changes'),
    iconClass: codicon('discard'),
  };
  export const GIT_DELETE_UNTRACKED_FILE = {
    id: 'arduino-git.deleteUntrackedFile',
    label: nls.localize(
      'arduino/git/deleteUntrackedFile',
      'Git: Delete Untracked File'
    ),
    iconClass: codicon('trash'),
  };
}

@injectable()
export class ArduinoGitContribution
  implements
    FrontendApplicationContribution,
    CommandContribution,
    MenuContribution
{
  @inject(GitService)
  private readonly gitService: GitService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(SketchesServiceClientImpl)
  private readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(ArduinoScmProvider)
  private readonly scmProvider: ArduinoScmProvider;

  @inject(ScmService)
  private readonly scmService: ScmService;

  @inject(ScmContribution)
  private readonly scmContribution: ScmContribution;

  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(MessageService)
  private readonly messageService: MessageService;

  @inject(QuickInputService)
  private readonly quickInputService: QuickInputService;

  private readonly toDispose = new DisposableCollection();
  private readonly onDidChangeGitCommandStateEmitter = new Emitter<void>();
  private readonly onDidChangeGitCommandState =
    this.onDidChangeGitCommandStateEmitter.event;
  private savedSketch = false;
  private gitRepo = false;
  private readonly refresh = debounce(
    async () => {
      await this.updateGitCommandState();
      await this.scmProvider.refresh();
      this.updateCommitPlaceholder();
    },
    300,
    {
      trailing: true,
    }
  );

  async onStart(): Promise<void> {
    this.toDispose.push(this.onDidChangeGitCommandStateEmitter);

    // Register our provider with Theia's SCM system
    this.scmService.registerScmProvider(this.scmProvider, {
      input: {
        placeholder: nls.localize(
          'arduino/git/commitPlaceholder',
          'Message ({0} to commit)'
        ),
      },
    });

    await this.updateGitCommandState();

    // Do the initial git status refresh
    await this.scmProvider.refresh();
    this.updateCommitPlaceholder();

    // Refresh when workspace changes (sketch switched)
    this.toDispose.push(
      this.workspaceService.onWorkspaceChanged(async () => {
        await this.updateGitCommandState();
        await this.scmProvider.refresh();
        this.updateCommitPlaceholder();
      })
    );
    this.toDispose.push(
      this.sketchServiceClient.onCurrentSketchDidChange(async () => {
        await this.updateGitCommandState();
        await this.scmProvider.refresh();
        this.updateCommitPlaceholder();
      })
    );
    this.toDispose.push(
      this.fileService.onDidFilesChange(() => {
        this.refresh();
      })
    );
  }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(ArduinoGitCommands.GIT_SOURCE_CONTROL, {
      execute: () => this.openSourceControl(),
      isEnabled: () => this.savedSketch,
      isVisible: () => this.savedSketch,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_INIT, {
      execute: () => this.handleInit(),
      isEnabled: () => this.canInitializeGit(),
      isVisible: () => this.canInitializeGit(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_COMMIT, {
      execute: () => this.handleCommit(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_COMMIT_OPTIONS, {
      execute: () => this.handleCommitOptions(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_COMMIT_AND_PUSH, {
      execute: () => this.handleCommitAndPush(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_STAGE_ALL, {
      execute: (...resources: GitCommandResource[]) =>
        resources.length ? this.stageFiles(resources) : this.handleStageAll(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_STAGE_UNTRACKED_ALL, {
      execute: (...resources: GitCommandResource[]) =>
        resources.length
          ? this.stageFiles(resources)
          : this.handleStageUntrackedAll(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_UNSTAGE_ALL, {
      execute: (...resources: GitCommandResource[]) =>
        resources.length
          ? this.unstageFiles(resources)
          : this.handleUnstageAll(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_DISCARD_ALL, {
      execute: (...resources: GitCommandResource[]) =>
        resources.length
          ? this.discardFiles(resources)
          : this.handleDiscardAll(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_DELETE_UNTRACKED_ALL, {
      execute: (...resources: GitCommandResource[]) =>
        resources.length
          ? this.deleteUntrackedFiles(resources)
          : this.handleDeleteUntrackedAll(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_PULL, {
      execute: () => this.handlePull(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_PUSH, {
      execute: () => this.handlePush(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_PUBLISH_BRANCH, {
      execute: () => this.handlePublishBranch(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_ADD_REMOTE, {
      execute: () => this.handleAddRemote(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_CHECKOUT, {
      execute: () => this.handleCheckout(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_CREATE_BRANCH, {
      execute: () => this.handleCreateBranch(),
      isEnabled: () => this.canUseGitRepository(),
      isVisible: () => this.canUseGitRepository(),
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_REFRESH, {
      execute: async () => {
        await this.updateGitCommandState();
        await this.scmProvider.refresh();
      },
      isEnabled: () => this.savedSketch,
      isVisible: () => this.savedSketch,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    // Per-file commands — called from SCM tree context menu
    registry.registerCommand(ArduinoGitCommands.GIT_STAGE_FILE, {
      execute: (...resources: GitCommandResource[]) =>
        this.stageFiles(resources),
      isEnabled: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      isVisible: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_UNSTAGE_FILE, {
      execute: (...resources: GitCommandResource[]) =>
        this.unstageFiles(resources),
      isEnabled: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      isVisible: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_DISCARD_FILE, {
      execute: (...resources: GitCommandResource[]) =>
        this.discardFiles(resources),
      isEnabled: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      isVisible: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });

    registry.registerCommand(ArduinoGitCommands.GIT_DELETE_UNTRACKED_FILE, {
      execute: (...resources: GitCommandResource[]) =>
        this.deleteUntrackedFiles(resources),
      isEnabled: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      isVisible: (...resources: GitCommandResource[]) =>
        this.canUseGitRepository() && this.toResourceUris(resources).length > 0,
      onDidChangeEnabled: this.onDidChangeGitCommandState,
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerSubmenu(
      ArduinoMenus.TOOLS__GIT_SUBMENU,
      nls.localize('arduino/git/gitMenu', 'Git'),
      { order: '10' }
    );
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_MAIN_GROUP, {
      commandId: ArduinoGitCommands.GIT_SOURCE_CONTROL.id,
      label: nls.localize(
        'arduino/git/sourceControlMenu',
        'Git Source Control'
      ),
      order: '0',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_MAIN_GROUP, {
      commandId: ArduinoGitCommands.GIT_INIT.id,
      label: nls.localize('arduino/git/initMenu', 'Initialize Git Repository'),
      order: '1',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_SYNC_GROUP, {
      commandId: ArduinoGitCommands.GIT_PULL.id,
      label: nls.localize('arduino/git/pullMenu', 'Git Pull'),
      order: '0',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_SYNC_GROUP, {
      commandId: ArduinoGitCommands.GIT_PUSH.id,
      label: nls.localize('arduino/git/pushMenu', 'Git Push'),
      order: '1',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_SYNC_GROUP, {
      commandId: ArduinoGitCommands.GIT_PUBLISH_BRANCH.id,
      label: nls.localize(
        'arduino/git/publishBranchMenu',
        'Git Publish Branch'
      ),
      order: '2',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_SYNC_GROUP, {
      commandId: ArduinoGitCommands.GIT_ADD_REMOTE.id,
      label: nls.localize('arduino/git/addRemoteMenu', 'Git Add Remote Origin'),
      order: '3',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_BRANCH_GROUP, {
      commandId: ArduinoGitCommands.GIT_CHECKOUT.id,
      label: nls.localize('arduino/git/checkoutMenu', 'Git Checkout Branch'),
      order: '0',
    });
    menus.registerMenuAction(ArduinoMenus.TOOLS__GIT_BRANCH_GROUP, {
      commandId: ArduinoGitCommands.GIT_CREATE_BRANCH.id,
      label: nls.localize('arduino/git/createBranchMenu', 'Git Create Branch'),
      order: '1',
    });

    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_ALL.id,
      label: nls.localize('arduino/git/stageAllMenu', 'Stage All Changes'),
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_UNTRACKED_ALL.id,
      label: nls.localize(
        'arduino/git/stageUntrackedAllMenu',
        'Stage All Untracked Files'
      ),
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_ALL.id,
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_UNTRACKED_ALL.id,
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_UNSTAGE_ALL.id,
      label: nls.localize('arduino/git/unstageAllMenu', 'Unstage All Changes'),
      order: '1',
      when: 'scmProvider == arduino-git && scmResourceGroup == index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_UNSTAGE_ALL.id,
      order: '1',
      when: 'scmProvider == arduino-git && scmResourceGroup == index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_DISCARD_ALL.id,
      label: nls.localize('arduino/git/discardAllMenu', 'Discard All Changes'),
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_DELETE_UNTRACKED_ALL.id,
      label: nls.localize(
        'arduino/git/deleteUntrackedAllMenu',
        'Delete All Untracked Files'
      ),
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_DISCARD_ALL.id,
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_GROUP_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_DELETE_UNTRACKED_ALL.id,
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });

    menus.registerMenuAction(ScmTreeWidget.RESOURCE_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_FILE.id,
      label: nls.localize('arduino/git/stageMenu', 'Stage Changes'),
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup != index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_STAGE_FILE.id,
      order: '0',
      when: 'scmProvider == arduino-git && scmResourceGroup != index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_UNSTAGE_FILE.id,
      label: nls.localize('arduino/git/unstageMenu', 'Unstage Changes'),
      order: '1',
      when: 'scmProvider == arduino-git && scmResourceGroup == index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_UNSTAGE_FILE.id,
      order: '1',
      when: 'scmProvider == arduino-git && scmResourceGroup == index',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_DISCARD_FILE.id,
      label: nls.localize('arduino/git/discardMenu', 'Discard Changes'),
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_CONTEXT_MENU, {
      commandId: ArduinoGitCommands.GIT_DELETE_UNTRACKED_FILE.id,
      label: nls.localize(
        'arduino/git/deleteUntrackedMenu',
        'Delete Untracked File'
      ),
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_DISCARD_FILE.id,
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == workingTree',
    });
    menus.registerMenuAction(ScmTreeWidget.RESOURCE_INLINE_MENU, {
      commandId: ArduinoGitCommands.GIT_DELETE_UNTRACKED_FILE.id,
      order: '2',
      when: 'scmProvider == arduino-git && scmResourceGroup == untracked',
    });
  }

  // ----------- Handlers -----------

  private async handleInit(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      await this.gitService.init(rootUri);
      await this.updateGitCommandState();
      await this.scmProvider.refresh();
      this.updateCommitPlaceholder();
      await this.openSourceControl();
      this.messageService.info(
        nls.localize('arduino/git/initSuccess', 'Git repository initialized.')
      );
    } catch (err) {
      this.messageService.error(
        nls.localize(
          'arduino/git/initError',
          'Failed to initialize git repository: {0}',
          String(err)
        )
      );
    }
  }

  private async handleCommit(): Promise<boolean> {
    const rootUri = this.getRootUri();
    if (!rootUri) return false;

    // Read message from SCM input box
    const scmRepository = this.scmService.selectedRepository;
    const message = scmRepository?.input.value?.trim();
    if (!message) {
      this.messageService.warn(
        nls.localize(
          'arduino/git/emptyCommitMessage',
          'Please enter a commit message.'
        )
      );
      return false;
    }

    try {
      const status = await this.gitService.status(rootUri);
      if (
        !status.staged.length &&
        (status.unstaged.length || status.untracked.length)
      ) {
        const stageAll = await new ConfirmDialog({
          title: nls.localize(
            'arduino/git/stageAllBeforeCommitTitle',
            'Stage All Changes'
          ),
          msg: nls.localize(
            'arduino/git/stageAllBeforeCommitMessage',
            'There are no staged changes to commit. Do you want to stage all changes and commit them?'
          ),
          ok: Dialog.YES,
          cancel: Dialog.CANCEL,
        }).open();
        if (!stageAll) {
          return false;
        }
        await this.gitService.stage(rootUri, ['.']);
      } else if (!status.staged.length) {
        this.messageService.warn(
          nls.localize(
            'arduino/git/noChangesToCommit',
            'There are no changes to commit.'
          )
        );
        return false;
      }

      await this.gitService.commit(rootUri, message);
      // Clear the input box
      if (scmRepository) {
        scmRepository.input.value = '';
      }
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/commitSuccess',
          'Changes committed successfully.'
        )
      );
      return true;
    } catch (err) {
      this.messageService.error(
        nls.localize(
          'arduino/git/commitError',
          'Commit failed: {0}',
          String(err)
        )
      );
      return false;
    }
  }

  private async handleCommitOptions(): Promise<void> {
    interface CommitOption extends QuickPickItem {
      command: string;
    }
    const picked = await this.quickInputService.showQuickPick<CommitOption>(
      [
        {
          label: nls.localize('arduino/git/commitOption', 'Commit'),
          description: nls.localize(
            'arduino/git/commitOptionDescription',
            'Create a local commit'
          ),
          command: ArduinoGitCommands.GIT_COMMIT.id,
        },
        {
          label: nls.localize(
            'arduino/git/commitAndPushOption',
            'Commit and Push'
          ),
          description: nls.localize(
            'arduino/git/commitAndPushOptionDescription',
            'Create a commit and push it to the upstream branch'
          ),
          command: ArduinoGitCommands.GIT_COMMIT_AND_PUSH.id,
        },
      ],
      {
        title: nls.localize('arduino/git/commitOptionsTitle', 'Commit Options'),
        placeholder: nls.localize(
          'arduino/git/commitOptionsPlaceholder',
          'Choose a commit action'
        ),
      }
    );
    if (picked) {
      if (picked.command === ArduinoGitCommands.GIT_COMMIT_AND_PUSH.id) {
        await this.handleCommitAndPush();
      } else {
        await this.handleCommit();
      }
    }
  }

  private async handleCommitAndPush(): Promise<void> {
    const committed = await this.handleCommit();
    if (committed) {
      await this.handlePush();
    }
  }

  private async handleStageAll(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      // Stage the whole directory
      await this.gitService.stage(rootUri, ['.']);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async handleStageUntrackedAll(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      const status = await this.gitService.status(rootUri);
      const files = status.untracked.map((change) => change.uri);
      if (!files.length) {
        return;
      }
      await this.gitService.stage(rootUri, files);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async handleUnstageAll(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      await this.gitService.unstage(rootUri, ['.']);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async handleDiscardAll(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const ok = await this.confirmDiscard(
      nls.localize(
        'arduino/git/discardAllConfirm',
        'Discard all unstaged changes? This cannot be undone.'
      )
    );
    if (!ok) {
      return;
    }
    try {
      await this.gitService.discard(rootUri, ['.']);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async handleDeleteUntrackedAll(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const ok = await this.confirmDeleteUntracked(
      nls.localize(
        'arduino/git/deleteUntrackedAllConfirm',
        'Delete all untracked files from disk? This cannot be undone.'
      )
    );
    if (!ok) {
      return;
    }
    try {
      await this.gitService.clean(rootUri, ['.']);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async handlePull(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const result: GitSyncResult = await this.gitService.pull(rootUri);
    if (result.success) {
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/pullSuccess',
          'Pull successful: {0}',
          result.message
        )
      );
    } else {
      this.messageService.error(
        nls.localize(
          'arduino/git/pullError',
          'Pull failed: {0}',
          result.message
        )
      );
    }
  }

  private async handlePush(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const status = await this.gitService.status(rootUri);
    if (!status.remoteBranch) {
      await this.handlePublishBranch();
      return;
    }
    const result: GitSyncResult = await this.gitService.push(rootUri);
    if (result.success) {
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize('arduino/git/pushSuccess', 'Push successful.')
      );
    } else {
      this.messageService.error(
        nls.localize(
          'arduino/git/pushError',
          'Push failed: {0}',
          result.message
        )
      );
    }
  }

  private async handlePublishBranch(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const hasOrigin = await this.ensureOriginRemote(rootUri);
    if (!hasOrigin) {
      return;
    }

    const result = await this.gitService.publish(rootUri, 'origin');
    if (result.success) {
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/publishSuccess',
          'Branch published successfully.'
        )
      );
    } else {
      this.messageService.error(
        nls.localize(
          'arduino/git/publishError',
          'Publish failed: {0}',
          result.message
        )
      );
    }
  }

  private async handleAddRemote(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const remote = await this.addOrUpdateOriginRemote(rootUri);
    if (remote) {
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/addRemoteSuccess',
          'Remote origin configured.'
        )
      );
    }
  }

  private async handleCheckout(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      const branches = await this.gitService.branches(rootUri);
      if (!branches.length) {
        await this.handleCreateBranch();
        return;
      }

      interface BranchPick extends QuickPickItem {
        branch?: GitBranch;
        create?: boolean;
      }
      const picked = await this.quickInputService.showQuickPick<BranchPick>(
        [
          {
            label: nls.localize(
              'arduino/git/createNewBranch',
              'Create new branch...'
            ),
            description: nls.localize(
              'arduino/git/createNewBranchDescription',
              'Create and checkout a branch from the current HEAD'
            ),
            create: true,
          },
          {
            type: 'separator',
            label: nls.localize('arduino/git/branches', 'Branches'),
          },
          ...branches.map((branch) => ({
            label: branch.current ? `$(check) ${branch.name}` : branch.name,
            description: branch.upstream,
            detail: branch.current
              ? nls.localize('arduino/git/currentBranch', 'Current branch')
              : undefined,
            branch,
          })),
        ],
        {
          title: nls.localize('arduino/git/checkoutTitle', 'Checkout Branch'),
          placeholder: nls.localize(
            'arduino/git/checkoutPlaceholder',
            'Select a branch to checkout'
          ),
          matchOnDescription: true,
          matchOnDetail: true,
        }
      );
      if (!picked) {
        return;
      }
      if (picked.create) {
        await this.handleCreateBranch();
        return;
      }
      const branch = picked.branch;
      if (!branch || branch.current) {
        return;
      }
      await this.gitService.checkout(rootUri, branch.name);
      await this.scmProvider.refresh();
      this.updateCommitPlaceholder();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/checkoutSuccess',
          "Checked out branch '{0}'.",
          branch.name
        )
      );
    } catch (err) {
      this.messageService.error(
        nls.localize(
          'arduino/git/checkoutError',
          'Checkout failed: {0}',
          String(err)
        )
      );
    }
  }

  private async handleCreateBranch(): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const branchName = await this.quickInputService.input({
      title: nls.localize('arduino/git/createBranchTitle', 'Create Branch'),
      prompt: nls.localize(
        'arduino/git/createBranchPrompt',
        'Enter the new branch name.'
      ),
      placeHolder: 'feature/my-change',
      validateInput: async (input) =>
        this.validateBranchNameInput(input.trim()),
    });
    const trimmed = branchName?.trim();
    if (!trimmed) {
      return;
    }
    try {
      await this.gitService.createBranch(rootUri, trimmed, true);
      await this.scmProvider.refresh();
      this.updateCommitPlaceholder();
      await this.updateGitCommandState();
      this.messageService.info(
        nls.localize(
          'arduino/git/createBranchSuccess',
          "Created and checked out branch '{0}'.",
          trimmed
        )
      );
    } catch (err) {
      this.messageService.error(
        nls.localize(
          'arduino/git/createBranchError',
          'Create branch failed: {0}',
          String(err)
        )
      );
    }
  }

  private async stageFiles(resources: GitCommandResource[]): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      const uris = this.toResourceUris(resources);
      await this.gitService.stage(rootUri, uris);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async unstageFiles(resources: GitCommandResource[]): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    try {
      const uris = this.toResourceUris(resources);
      await this.gitService.unstage(rootUri, uris);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async discardFiles(resources: GitCommandResource[]): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const ok = await this.confirmDiscard(
      nls.localize(
        'arduino/git/discardFilesConfirm',
        'Discard selected unstaged changes? This cannot be undone.'
      )
    );
    if (!ok) {
      return;
    }
    try {
      const uris = this.toResourceUris(resources);
      await this.gitService.discard(rootUri, uris);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private async deleteUntrackedFiles(
    resources: GitCommandResource[]
  ): Promise<void> {
    const rootUri = this.getRootUri();
    if (!rootUri) return;
    const ok = await this.confirmDeleteUntracked(
      nls.localize(
        'arduino/git/deleteUntrackedFilesConfirm',
        'Delete selected untracked files from disk? This cannot be undone.'
      )
    );
    if (!ok) {
      return;
    }
    try {
      const uris = this.toResourceUris(resources);
      await this.gitService.clean(rootUri, uris);
      await this.scmProvider.refresh();
      await this.updateGitCommandState();
    } catch (err) {
      this.messageService.error(String(err));
    }
  }

  private toResourceUris(resources: GitCommandResource[]): string[] {
    const uris: string[] = [];
    for (const resource of resources) {
      if (Array.isArray(resource)) {
        uris.push(...this.toResourceUris(resource));
      } else if (typeof resource === 'string') {
        uris.push(resource);
      } else if (this.isScmResource(resource)) {
        uris.push(resource.sourceUri.toString());
      } else if (this.isScmResourceGroup(resource)) {
        uris.push(
          ...resource.resources.map((item) => item.sourceUri.toString())
        );
      }
    }
    return uris;
  }

  private isScmResource(resource: unknown): resource is ScmResource {
    return (
      !!resource && typeof resource === 'object' && 'sourceUri' in resource
    );
  }

  private isScmResourceGroup(resource: unknown): resource is ScmResourceGroup {
    return (
      !!resource && typeof resource === 'object' && 'resources' in resource
    );
  }

  private async ensureOriginRemote(rootUri: string): Promise<boolean> {
    const remotes = await this.gitService.remotes(rootUri);
    if (this.findOrigin(remotes)) {
      return true;
    }
    return !!(await this.addOrUpdateOriginRemote(rootUri, remotes));
  }

  private async addOrUpdateOriginRemote(
    rootUri: string,
    remotes?: GitRemote[]
  ): Promise<GitRemote | undefined> {
    const knownRemotes = remotes ?? (await this.gitService.remotes(rootUri));
    const origin = this.findOrigin(knownRemotes);
    const url = await this.promptRemoteUrl(origin?.fetchUrl ?? origin?.pushUrl);
    if (!url) {
      return undefined;
    }
    if (origin) {
      const update = await new ConfirmDialog({
        title: nls.localize(
          'arduino/git/updateRemoteTitle',
          'Update Remote Origin'
        ),
        msg: nls.localize(
          'arduino/git/updateRemoteMessage',
          'Remote origin already exists. Do you want to update its URL?'
        ),
        ok: Dialog.YES,
        cancel: Dialog.CANCEL,
      }).open();
      if (!update) {
        return undefined;
      }
      await this.gitService.setRemoteUrl(rootUri, 'origin', url);
      return { name: 'origin', fetchUrl: url, pushUrl: url };
    }
    await this.gitService.addRemote(rootUri, 'origin', url);
    return { name: 'origin', fetchUrl: url, pushUrl: url };
  }

  private findOrigin(remotes: GitRemote[]): GitRemote | undefined {
    return remotes.find((remote) => remote.name === 'origin');
  }

  private async promptRemoteUrl(
    initialValue = ''
  ): Promise<string | undefined> {
    const value = await new SingleTextInputDialog({
      title: nls.localize('arduino/git/addRemoteTitle', 'Add Remote Origin'),
      initialValue,
      placeholder: 'https://github.com/user/repository.git',
      confirmButtonLabel: Dialog.OK,
      validate: (input) =>
        input.trim()
          ? ''
          : nls.localize(
              'arduino/git/remoteUrlRequired',
              'Remote URL is required.'
            ),
    }).open();
    return value?.trim() || undefined;
  }

  private validateBranchNameInput(input: string): string | undefined {
    if (!input) {
      return nls.localize(
        'arduino/git/branchNameRequired',
        'Branch name is required.'
      );
    }
    if (
      input.startsWith('-') ||
      input.endsWith('/') ||
      input.endsWith('.') ||
      input.includes('..') ||
      input.includes('@{') ||
      /\s/.test(input) ||
      ['~', '^', ':', '?', '*', '[', '\\'].some((char) => input.includes(char))
    ) {
      return nls.localize(
        'arduino/git/branchNameInvalid',
        'Enter a valid Git branch name.'
      );
    }
    return undefined;
  }

  private async confirmDiscard(message: string): Promise<boolean> {
    return !!(await new ConfirmDialog({
      title: nls.localize('arduino/git/discardConfirmTitle', 'Discard Changes'),
      msg: message,
      ok: Dialog.YES,
      cancel: Dialog.CANCEL,
    }).open());
  }

  private async confirmDeleteUntracked(message: string): Promise<boolean> {
    return !!(await new ConfirmDialog({
      title: nls.localize(
        'arduino/git/deleteUntrackedConfirmTitle',
        'Delete Untracked Files'
      ),
      msg: message,
      ok: Dialog.YES,
      cancel: Dialog.CANCEL,
    }).open());
  }

  private async openSourceControl(): Promise<void> {
    await this.scmContribution.openView({ reveal: true });
  }

  private getRootUri(): string | undefined {
    const roots = this.workspaceService.tryGetRoots();
    return roots[0]?.resource.toString();
  }

  private canInitializeGit(): boolean {
    return this.savedSketch && !this.gitRepo;
  }

  private canUseGitRepository(): boolean {
    return this.savedSketch && this.gitRepo;
  }

  private updateCommitPlaceholder(): void {
    const repository = this.scmService.selectedRepository;
    if (!repository) {
      return;
    }
    const branch = this.scmProvider.branch;
    repository.input.placeholder = branch
      ? nls
          .localize(
            'arduino/git/commitPlaceholderOnBranch',
            'Message ({0} to commit on "{branch}")'
          )
          .replace('{branch}', branch)
      : nls.localize(
          'arduino/git/commitPlaceholder',
          'Message ({0} to commit)'
        );
  }

  private async updateGitCommandState(): Promise<void> {
    const previousSavedSketch = this.savedSketch;
    const previousGitRepo = this.gitRepo;
    this.savedSketch = await this.isSavedSketch();
    const rootUri = this.getRootUri();
    this.gitRepo =
      this.savedSketch && !!rootUri
        ? await this.gitService.isGitRepo(rootUri)
        : false;

    if (
      previousSavedSketch !== this.savedSketch ||
      previousGitRepo !== this.gitRepo
    ) {
      this.onDidChangeGitCommandStateEmitter.fire();
    }
  }

  private async isSavedSketch(): Promise<boolean> {
    const sketch = this.sketchServiceClient.tryGetCurrentSketch();
    const rootUri = this.getRootUri();
    if (!rootUri || !CurrentSketch.isValid(sketch) || rootUri !== sketch.uri) {
      return false;
    }
    return !(await this.sketchesService.isTemp(sketch));
  }

  onStop(): void {
    this.toDispose.dispose();
  }
}
