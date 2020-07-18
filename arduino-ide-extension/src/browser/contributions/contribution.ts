import { inject, injectable, interfaces } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { notEmpty } from '@theia/core/lib/common/objects';
import { FileSystem } from '@theia/filesystem/lib/common';
import { MessageService } from '@theia/core/lib/common/message-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { MenuModelRegistry, MenuContribution } from '@theia/core/lib/common/menu';
import { KeybindingRegistry, KeybindingContribution } from '@theia/core/lib/browser/keybinding';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { Command, CommandRegistry, CommandContribution, CommandService } from '@theia/core/lib/common/command';
import { SketchesService, ConfigService, FileSystemExt, Sketch } from '../../common/protocol';
import { EditorMode } from '../editor-mode';
import { EditorManager } from '@theia/editor/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

export { Command, CommandRegistry, MenuModelRegistry, KeybindingRegistry, TabBarToolbarRegistry, URI, Sketch };

@injectable()
export abstract class Contribution implements CommandContribution, MenuContribution, KeybindingContribution, TabBarToolbarContribution {

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    registerCommands(registry: CommandRegistry): void {
    }

    registerMenus(registry: MenuModelRegistry): void {
    }

    registerKeybindings(registry: KeybindingRegistry): void {
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
    }

}

@injectable()
export abstract class SketchContribution extends Contribution {

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(FileSystemExt)
    protected readonly fileSystemExt: FileSystemExt;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(SketchesService)
    protected readonly sketchService: SketchesService;

    protected async getCurrentSketch(): Promise<Sketch | undefined> {
        const sketches = (await Promise.all(this.workspaceService.tryGetRoots().map(({ uri }) => this.sketchService.getSketchFolder(uri)))).filter(notEmpty);
        if (!sketches.length) {
            return;
        }
        if (sketches.length > 1) {
            console.log(`Multiple sketch folders were found in the workspace. Falling back to the first one. Sketch folders: ${JSON.stringify(sketches)}`);
        }
        return sketches[0];
    }

}

@injectable()
export abstract class EditorContribution extends Contribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    protected async current(): Promise<MonacoEditor | undefined> {
        const editor = this.editorManager.currentEditor?.editor;
        return editor instanceof MonacoEditor ? editor : undefined;
    }

    protected async run(commandId: string): Promise<any> {
        const editor = await this.current();
        if (editor) {
            const action = editor.getControl().getAction(commandId);
            if (action) {
                return action.run();
            }
        }
    }

}

export namespace Contribution {
    export function configure<T>(bind: interfaces.Bind, serviceIdentifier: interfaces.ServiceIdentifier<T>): void {
        bind(serviceIdentifier).toSelf().inSingletonScope();
        bind(CommandContribution).toService(serviceIdentifier);
        bind(MenuContribution).toService(serviceIdentifier);
        bind(KeybindingContribution).toService(serviceIdentifier);
        bind(TabBarToolbarContribution).toService(serviceIdentifier);
    }
}
