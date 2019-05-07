import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { MessageService } from '@theia/core/lib/common/message-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { DefaultFrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { BoardsService } from '../common/protocol/boards-service';
import { ArduinoCommands } from './arduino-commands';
import { ConnectedBoards } from './components/connected-boards';
import { CoreService } from '../common/protocol/core-service';
import { WorkspaceServiceExt } from './workspace-service-ext';
import { ToolOutputServiceClient } from '../common/protocol/tool-output-service';


@injectable()
export class ArduinoFrontendContribution extends DefaultFrontendApplicationContribution implements TabBarToolbarContribution, CommandContribution {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(BoardsService)
    protected readonly boardService: BoardsService;

    @inject(CoreService)
    protected readonly coreService: CoreService;

    @inject(WorkspaceServiceExt)
    protected readonly workspaceServiceExt: WorkspaceServiceExt;

    @inject(ToolOutputServiceClient)
    protected readonly toolOutputServiceClient: ToolOutputServiceClient;

    @postConstruct()
    protected async init(): Promise<void> {
        // This is a hack. Otherwise, the backend services won't bind.
        await this.workspaceServiceExt.roots();
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: ArduinoCommands.VERIFY.id,
            command: ArduinoCommands.VERIFY.id,
            tooltip: 'Verify',
            group: 'arduino',
            text: '$(check)'
        });
        registry.registerItem({
            id: ArduinoCommands.UPLOAD.id,
            command: ArduinoCommands.UPLOAD.id,
            tooltip: 'Upload',
            group: 'arduino',
            text: '$(arrow-right)'
        });
        registry.registerItem({
            id: ConnectedBoards.TOOLBAR_ID,
            render: () => <ConnectedBoards boardsService={this.boardService}/>,
            isVisible: widget => this.isArduinoEditor(widget)
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ArduinoCommands.VERIFY, {
            isVisible: widget => this.isArduinoEditor(widget),
            isEnabled: widget => this.isArduinoEditor(widget),
            execute: async widget => {
                const uri = this.toUri(widget);
                if (uri) {
                    const result = await this.coreService.compile({ uri: uri.toString() });
                    console.log('compile result', result);
                }
            }
        });
        registry.registerCommand(ArduinoCommands.UPLOAD, {
            isVisible: widget => this.isArduinoEditor(widget),
            isEnabled: widget => this.isArduinoEditor(widget),
            execute: async widget => {
                const uri = this.toUri(widget);
                if (uri) {
                    const result = await this.coreService.upload({ uri: uri.toString() });
                    console.log('upload result', result);
                }
            }
        });
    }

    private isArduinoEditor(maybeEditorWidget: any): boolean {
        if (maybeEditorWidget instanceof EditorWidget) {
            return maybeEditorWidget.editor.uri.toString().endsWith('.ino');
        }
        return false;
    }

    private toUri(arg: any): URI | undefined {
        if (arg instanceof URI) {
            return arg;
        }
        if (typeof arg === 'string') {
            return new URI(arg);
        }
        if (arg instanceof EditorWidget) {
            return arg.editor.uri;
        }
        return undefined;
    }

}
