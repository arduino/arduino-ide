
import { VariableContribution, VariableRegistry, Variable } from '@theia/variable-resolver/lib/browser';
import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ApplicationShell, Navigatable } from '@theia/core/lib/browser';
import { FileStat, FileSystem } from '@theia/filesystem/lib/common';
import { WorkspaceVariableContribution } from '@theia/workspace/lib/browser/workspace-variable-contribution';
import { BoardsServiceClientImpl } from 'arduino-ide-extension/lib/browser/boards/boards-service-client-impl';
import { BoardsService, ToolLocations } from 'arduino-ide-extension/lib/common/protocol/boards-service';

@injectable()
export class ArduinoVariableResolver implements VariableContribution {

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(WorkspaceVariableContribution)
    protected readonly workspaceVars: WorkspaceVariableContribution;

    @inject(ApplicationShell)
    protected readonly applicationShell: ApplicationShell;

    @inject(FileSystem)
    protected readonly fileSystem: FileSystem;

    @inject(MessageService)
    protected readonly messageService: MessageService

    registerVariables(variables: VariableRegistry): void {
        variables.registerVariable(<Variable>{
            name: 'boardTools',
            description: 'Provides paths and access to board specific tooling',
            resolve: this.resolveBoardTools.bind(this),
        });
        variables.registerVariable(<Variable>{
            name: 'board',
            description: 'Provides details about the currently selected board',
            resolve: this.resolveBoard.bind(this),
        });
        variables.registerVariable({
            name: 'sketchBinary',
            description: 'Path to the sketch\'s binary file',
            resolve: this.resolveSketchBinary.bind(this)
        });
    }

    protected resolveSketchBinary(context?: URI, argument?: string, configurationSection?: string): Promise<Object | undefined> {
        if (argument) {
            return this.resolveBinaryWithHint(argument);
        }
        const resourceUri = this.workspaceVars.getResourceUri();
        if (resourceUri) {
            return this.resolveBinaryWithHint(resourceUri.toString());
        }
        for (const tabBar of this.applicationShell.mainAreaTabBars) {
            if (tabBar.currentTitle && Navigatable.is(tabBar.currentTitle.owner)) {
                const uri = tabBar.currentTitle.owner.getResourceUri();
                if (uri) {
                    return this.resolveBinaryWithHint(uri.toString());
                }
            }
        }
        this.messageService.error('No sketch available. Please open a sketch to start debugging.');
        return Promise.resolve(undefined);
    }

    private async resolveBinaryWithHint(hint: string): Promise<string | undefined> {
        const fileStat = await this.fileSystem.getFileStat(hint);
        if (!fileStat) {
            this.messageService.error('Cannot find sketch binary: ' + hint);
            return undefined;
        }
        if (!fileStat.isDirectory && fileStat.uri.endsWith('.elf')) {
            return this.fileSystem.getFsPath(fileStat.uri);
        }

        let parent: FileStat | undefined;
        let prefix: string | undefined;
        let suffix: string;
        if (fileStat.isDirectory) {
            parent = fileStat;
        } else {
            const uri = new URI(fileStat.uri);
            parent = await this.fileSystem.getFileStat(uri.parent.toString());
            prefix = uri.path.name;
        }
        const { boardsConfig } = this.boardsServiceClient;
        if (boardsConfig && boardsConfig.selectedBoard && boardsConfig.selectedBoard.fqbn) {
            suffix = boardsConfig.selectedBoard.fqbn.replace(/:/g, '.') + '.elf';
        } else {
            suffix = '.elf';
        }
        if (parent && parent.children) {
            let bin: FileStat | undefined;
            if (prefix) {
                bin = parent.children.find(c => c.uri.startsWith(prefix!) && c.uri.endsWith(suffix));
            }
            if (!bin) {
                bin = parent.children.find(c => c.uri.endsWith(suffix));
            }
            if (!bin && suffix.length > 4) {
                bin = parent.children.find(c => c.uri.endsWith('.elf'));
            }
            if (bin) {
                return this.fileSystem.getFsPath(bin.uri);
            }
        }
        this.messageService.error('Cannot find sketch binary: ' + hint);
        return undefined;
    }

    protected async resolveBoard(context?: URI, argument?: string, configurationSection?: string): Promise<string | undefined> {
        const { boardsConfig } = this.boardsServiceClient;
        if (!boardsConfig || !boardsConfig.selectedBoard) {
            this.messageService.error('No boards selected. Please select a board.');
            return undefined;
        }

        if (!argument || argument === 'fqbn') {
            return boardsConfig.selectedBoard.fqbn!;
        }
        if (argument === 'name') {
            return boardsConfig.selectedBoard.name;
        }

        const details = await this.boardsService.detail({ id: boardsConfig.selectedBoard.fqbn! });
        if (!details.item) {
            this.messageService.error('Details of the selected boards are not available.');
            return undefined;
        }
        if (argument === 'openocd-debug-file') {
            return details.item.locations!.debugScript;
        }

        return boardsConfig.selectedBoard.fqbn!;
    }

    protected async resolveBoardTools(context?: URI, argument?: string, configurationSection?: string): Promise<string | undefined> {
        const { boardsConfig } = this.boardsServiceClient;
        if (!boardsConfig || !boardsConfig.selectedBoard) {
            this.messageService.error('No boards selected. Please select a board.');
            return undefined;
        }
        const details = await this.boardsService.detail({ id: boardsConfig.selectedBoard.fqbn! });
        if (!details.item) {
            this.messageService.error('Details of the selected boards are not available.');
            return undefined;
        }

        let toolLocations: { [name: string]: ToolLocations } = {};
        details.item.requiredTools.forEach(t => {
            toolLocations[t.name] = t.locations!;
        })

        switch (argument) {
            case 'openocd': {
                const openocd = toolLocations['openocd'];
                if (openocd) {
                    return openocd.main;
                }
                this.messageService.error('Unable to find debugging tool: openocd');
                return undefined;
            }
            case 'openocd-scripts': {
                const openocd = toolLocations['openocd'];
                return openocd ? openocd.scripts : undefined;
            }
            case 'objdump': {
                const gcc = Object.keys(toolLocations).find(key => key.endsWith('gcc'));
                if (gcc) {
                    return toolLocations[gcc].objdump;
                }
                this.messageService.error('Unable to find debugging tool: objdump');
                return undefined;
            }
            case 'gdb': {
                const gcc = Object.keys(toolLocations).find(key => key.endsWith('gcc'));
                if (gcc) {
                    return toolLocations[gcc].gdb;
                }
                this.messageService.error('Unable to find debugging tool: gdb');
                return undefined;
            }
        }

        return undefined;
    }

}
