import { inject, injectable } from 'inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { ArduinoToolbar } from '../toolbar/arduino-toolbar';
import { NotificationCenter } from '../notification-center';
import { Board, BoardsService, ExecutableService } from '../../common/protocol';
import { BoardsServiceProvider } from '../boards/boards-service-provider';
import { URI, Command, CommandRegistry, SketchContribution, TabBarToolbarRegistry } from './contribution';

@injectable()
export class Debug extends SketchContribution {

    @inject(HostedPluginSupport)
    protected hostedPluginSupport: HostedPluginSupport;

    @inject(NotificationCenter)
    protected readonly notificationCenter: NotificationCenter;

    @inject(ExecutableService)
    protected readonly executableService: ExecutableService;

    @inject(BoardsService)
    protected readonly boardService: BoardsService;

    @inject(BoardsServiceProvider)
    protected readonly boardsServiceProvider: BoardsServiceProvider;

    /**
     * If `undefined`, debugging is enabled. Otherwise, the reason why it's disabled.
     */
    protected _disabledMessages?: string = 'No board selected'; // Initial pessimism.
    protected disabledMessageDidChangeEmitter = new Emitter<string | undefined>();
    protected onDisabledMessageDidChange = this.disabledMessageDidChangeEmitter.event;

    protected get disabledMessage(): string | undefined {
        return this._disabledMessages;
    }
    protected set disabledMessage(message: string | undefined) {
        this._disabledMessages = message;
        this.disabledMessageDidChangeEmitter.fire(this._disabledMessages);
    }

    protected readonly debugToolbarItem = {
        id: Debug.Commands.START_DEBUGGING.id,
        command: Debug.Commands.START_DEBUGGING.id,
        tooltip: `${this.disabledMessage ? `Debug - ${this.disabledMessage}` : 'Start Debugging'}`,
        priority: 3,
        onDidChange: this.onDisabledMessageDidChange as Event<void>
    };

    onStart(): void {
        this.onDisabledMessageDidChange(() => this.debugToolbarItem.tooltip = `${this.disabledMessage ? `Debug - ${this.disabledMessage}` : 'Start Debugging'}`);
        const refreshState = async (board: Board | undefined = this.boardsServiceProvider.boardsConfig.selectedBoard) => {
            if (!board) {
                this.disabledMessage = 'No board selected';
                return;
            }
            const fqbn = board.fqbn;
            if (!fqbn) {
                this.disabledMessage = `Platform is not installed for '${board.name}'`;
                return;
            }
            const details = await this.boardService.getBoardDetails({ fqbn });
            if (!details) {
                this.disabledMessage = `Platform is not installed for '${board.name}'`;
                return;
            }
            const { debuggingSupported } = details;
            if (!debuggingSupported) {
                this.disabledMessage = `Debugging is not supported by '${board.name}'`;
            } else {
                this.disabledMessage = undefined;
            }
        }
        this.boardsServiceProvider.onBoardsConfigChanged(({ selectedBoard }) => refreshState(selectedBoard));
        this.notificationCenter.onPlatformInstalled(() => refreshState());
        this.notificationCenter.onPlatformUninstalled(() => refreshState());
        refreshState();
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(Debug.Commands.START_DEBUGGING, {
            execute: () => this.startDebug(),
            isVisible: widget => ArduinoToolbar.is(widget) && widget.side === 'left',
            isEnabled: () => !this.disabledMessage
        });
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem(this.debugToolbarItem);
    }

    protected async startDebug(board: Board | undefined = this.boardsServiceProvider.boardsConfig.selectedBoard): Promise<void> {
        if (!board) {
            return;
        }
        const { name, fqbn } = board;
        if (!fqbn) {
            return;
        }
        await this.hostedPluginSupport.didStart;
        const [sketch, executables] = await Promise.all([
            this.sketchServiceClient.currentSketch(),
            this.executableService.list()
        ]);
        if (!sketch) {
            return;
        }
        const [cliPath, sketchPath] = await Promise.all([
            this.fileService.fsPath(new URI(executables.cliUri)),
            this.fileService.fsPath(new URI(sketch.uri))
        ])
        const config = {
            cliPath,
            board: {
                fqbn,
                name
            },
            sketchPath
        };
        return this.commandService.executeCommand('arduino.debug.start', config);
    }

}

export namespace Debug {
    export namespace Commands {
        export const START_DEBUGGING: Command = {
            id: 'arduino-start-debug',
            label: 'Start Debugging',
            category: 'Arduino'
        }
    }
}
