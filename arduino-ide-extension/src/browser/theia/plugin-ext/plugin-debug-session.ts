import { ContributionProvider, MessageClient } from '@theia/core';
import { LabelProvider } from '@theia/core/lib/browser';
import { BreakpointManager } from '@theia/debug/lib/browser/breakpoint/breakpoint-manager';
import { DebugContribution } from '@theia/debug/lib/browser/debug-contribution';
import { DebugSession as TheiaDebugSession } from '@theia/debug/lib/browser/debug-session';
import { DebugSessionConnection } from '@theia/debug/lib/browser/debug-session-connection';
import { DebugConfigurationSessionOptions } from '@theia/debug/lib/browser/debug-session-options';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { TerminalOptionsExt } from '@theia/plugin-ext';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import {
  TerminalWidget,
  TerminalWidgetOptions,
} from '@theia/terminal/lib/browser/base/terminal-widget';
import { DebugSession } from '../debug/debug-session';
import { EditorManager } from '../editor/editor-manager';
import { WorkspaceService } from '../workspace/workspace-service';

// This class extends the patched debug session, and not the default debug session from Theia
export class PluginDebugSession extends DebugSession {
  constructor(
    override readonly id: string,
    override readonly options: DebugConfigurationSessionOptions,
    override readonly parentSession: TheiaDebugSession | undefined,
    protected override readonly connection: DebugSessionConnection,
    protected override readonly terminalServer: TerminalService,
    protected override readonly editorManager: EditorManager,
    protected override readonly breakpoints: BreakpointManager,
    protected override readonly labelProvider: LabelProvider,
    protected override readonly messages: MessageClient,
    protected override readonly fileService: FileService,
    protected readonly terminalOptionsExt: TerminalOptionsExt | undefined,
    protected override readonly debugContributionProvider: ContributionProvider<DebugContribution>,
    protected override readonly workspaceService: WorkspaceService
  ) {
    super(
      id,
      options,
      parentSession,
      connection,
      terminalServer,
      editorManager,
      breakpoints,
      labelProvider,
      messages,
      fileService,
      debugContributionProvider,
      workspaceService
    );
  }

  protected override async doCreateTerminal(
    terminalWidgetOptions: TerminalWidgetOptions
  ): Promise<TerminalWidget> {
    terminalWidgetOptions = Object.assign(
      {},
      terminalWidgetOptions,
      this.terminalOptionsExt
    );
    return super.doCreateTerminal(terminalWidgetOptions);
  }
}
