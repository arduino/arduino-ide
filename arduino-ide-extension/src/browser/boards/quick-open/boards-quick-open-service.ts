import * as fuzzy from 'fuzzy';
import { inject, injectable, postConstruct, named } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common/command';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser/keybinding';
import { QuickOpenItem, QuickOpenModel, QuickOpenMode, QuickOpenGroupItem } from '@theia/core/lib/common/quick-open-model';
import {
    QuickOpenService,
    QuickOpenHandler,
    QuickOpenOptions,
    QuickOpenItemOptions,
    QuickOpenContribution,
    QuickOpenActionProvider,
    QuickOpenHandlerRegistry,
    QuickOpenGroupItemOptions
} from '@theia/core/lib/browser/quick-open';
import { naturalCompare } from '../../../common/utils';
import { BoardsService, Port, Board, ConfigOption, ConfigValue } from '../../../common/protocol';
import { CoreServiceClientImpl } from '../../core-service-client-impl';
import { BoardsConfigStore } from '../boards-config-store';
import { BoardsServiceClientImpl, AvailableBoard } from '../boards-service-client-impl';

@injectable()
export class BoardsQuickOpenService implements QuickOpenContribution, QuickOpenModel, QuickOpenHandler, CommandContribution, KeybindingContribution, Command {

    readonly id = 'arduino-boards-quick-open';
    readonly prefix = '|';
    readonly description = 'Configure Available Boards';
    readonly label: 'Configure Available Boards';

    @inject(ILogger)
    @named('boards-quick-open')
    protected readonly logger: ILogger;

    @inject(QuickOpenService)
    protected readonly quickOpenService: QuickOpenService;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClientImpl)
    protected readonly boardsServiceClient: BoardsServiceClientImpl;

    @inject(BoardsConfigStore)
    protected readonly configStore: BoardsConfigStore;

    @inject(CoreServiceClientImpl)
    protected coreServiceClient: CoreServiceClientImpl;

    protected isOpen: boolean = false;
    protected currentQuery: string = '';
    // Attached boards plus the user's config.
    protected availableBoards: AvailableBoard[] = [];
    // Only for the `selected` one from the `availableBoards`. Note: the `port` of the `selected` is optional.
    protected boardConfigs: ConfigOption[] = [];
    protected allBoards: Board.Detailed[] = []
    protected selectedBoard?: (AvailableBoard & { port: Port });

    // `init` name is used by the `QuickOpenHandler`.
    @postConstruct()
    protected postConstruct(): void {
        this.coreServiceClient.onIndexUpdated(() => this.update(this.availableBoards));
        this.boardsServiceClient.onAvailableBoardsChanged(availableBoards => this.update(availableBoards));
        this.update(this.boardsServiceClient.availableBoards);
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(this, { execute: () => this.open() });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({ command: this.id, keybinding: 'ctrlCmd+k ctrlCmd+b' });
    }

    registerQuickOpenHandlers(registry: QuickOpenHandlerRegistry): void {
        registry.registerHandler(this);
    }

    getModel(): QuickOpenModel {
        return this;
    }

    getOptions(): QuickOpenOptions {
        let placeholder = '';
        if (!this.selectedBoard) {
            placeholder += 'No board selected.';
        }
        placeholder += 'Type to filter boards';
        if (this.boardConfigs.length) {
            placeholder += ' or use the ↓↑ keys to adjust the board settings...';
        } else {
            placeholder += '...';
        }
        return {
            placeholder,
            fuzzyMatchLabel: true,
            onClose: () => this.isOpen = false
        };
    }

    open(): void {
        this.isOpen = true;
        this.quickOpenService.open(this, this.getOptions());
    }

    onType(
        lookFor: string,
        acceptor: (items: QuickOpenItem<QuickOpenItemOptions>[], actionProvider?: QuickOpenActionProvider) => void): void {

        this.currentQuery = lookFor;
        const fuzzyFilter = this.fuzzyFilter(lookFor);
        const availableBoards = this.availableBoards.filter(AvailableBoard.hasPort).filter(({ name }) => fuzzyFilter(name));
        const toAccept: QuickOpenItem<QuickOpenItemOptions>[] = [];

        // Show the selected attached in a different group.
        if (this.selectedBoard && fuzzyFilter(this.selectedBoard.name)) {
            toAccept.push(this.toQuickItem(this.selectedBoard, { groupLabel: 'Selected Board' }));
        }

        // Filter the selected from the attached ones.
        toAccept.push(...availableBoards.filter(board => board !== this.selectedBoard).map((board, i) => {
            let group: QuickOpenGroupItemOptions | undefined = undefined;
            if (i === 0) {
                // If no `selectedBoard`, then this item is the top one, no borders required.
                group = { groupLabel: 'Attached Boards', showBorder: !!this.selectedBoard };
            }
            return this.toQuickItem(board, group);
        }));

        // Show the config only if the `input` is empty.
        if (!lookFor.trim().length) {
            toAccept.push(...this.boardConfigs.map((config, i) => {
                let group: QuickOpenGroupItemOptions | undefined = undefined;
                if (i === 0) {
                    group = { groupLabel: 'Board Settings', showBorder: true };
                }
                return this.toQuickItem(config, group);
            }));
        } else {
            toAccept.push(...this.allBoards.filter(({ name }) => fuzzyFilter(name)).map((board, i) => {
                let group: QuickOpenGroupItemOptions | undefined = undefined;
                if (i === 0) {
                    group = { groupLabel: 'Boards', showBorder: true };
                }
                return this.toQuickItem(board, group);
            }));
        }

        acceptor(toAccept);
    }

    private fuzzyFilter(lookFor: string): (inputString: string) => boolean {
        const shouldFilter = !!lookFor.trim().length;
        return (inputString: string) => shouldFilter ? fuzzy.test(lookFor.toLocaleLowerCase(), inputString.toLocaleLowerCase()) : true;
    }

    protected async update(availableBoards: AvailableBoard[]): Promise<void> {
        // `selectedBoard` is not an attached board, we need to show the board settings for it (TODO: clarify!)
        const selectedBoard = availableBoards.filter(AvailableBoard.hasPort).find(({ selected }) => selected);
        const [configs, boards] = await Promise.all([
            selectedBoard && selectedBoard.fqbn ? this.configStore.getConfig(selectedBoard.fqbn) : Promise.resolve([]),
            this.boardsService.searchBoards({})
        ]);
        this.allBoards = Board.decorateBoards(selectedBoard, boards)
            .filter(board => !availableBoards.some(availableBoard => Board.sameAs(availableBoard, board)));
        this.availableBoards = availableBoards;
        this.boardConfigs = configs;
        this.selectedBoard = selectedBoard;

        if (this.isOpen) {
            // Hack, to update the state without closing and reopening the quick open widget.
            (this.quickOpenService as any).onType(this.currentQuery);
        }
    }

    protected toQuickItem(item: BoardsQuickOpenService.Item, group?: QuickOpenGroupItemOptions): QuickOpenItem<QuickOpenItemOptions> {
        let options: QuickOpenItemOptions;
        if (AvailableBoard.is(item)) {
            const description = `on ${Port.toString(item.port)}`
            options = {
                label: `${item.name}`,
                description,
                descriptionHighlights: [
                    {
                        start: 0,
                        end: description.length
                    }
                ],
                run: this.toRun(() => this.boardsServiceClient.boardsConfig = ({ selectedBoard: item, selectedPort: item.port }))
            };
        } else if (ConfigOption.is(item)) {
            const selected = item.values.find(({ selected }) => selected);
            const value = selected ? selected.label : 'Not set';
            const label = `${item.label}: ${value}`;
            options = {
                label,
                // Intended to match the value part of a board setting.
                // NOTE: this does not work, as `fuzzyMatchLabel: true` is set. Manual highlighting is ignored, apparently.
                labelHighlights: [
                    {
                        start: label.length - value.length,
                        end: label.length
                    }
                ],
                run: (mode) => {
                    if (mode === QuickOpenMode.OPEN) {
                        this.setConfig(item);
                        return false;
                    }
                    return true;
                }
            };
            if (!selected) {
                options.description = 'Not set';
            };
        } else {
            options = {
                label: `${item.name}`,
                description: `${item.missing ? '' : `[installed with '${item.packageName}']`}`,
                run: (mode) => {
                    if (mode === QuickOpenMode.OPEN) {
                        this.selectBoard(item);
                        return false;
                    }
                    return true;
                }
            };
        }
        if (group) {
            return new QuickOpenGroupItem<QuickOpenGroupItemOptions>({ ...options, ...group });
        } else {
            return new QuickOpenItem<QuickOpenItemOptions>(options);
        }
    }

    protected toRun(run: (() => void)): ((mode: QuickOpenMode) => boolean) {
        return (mode) => {
            if (mode !== QuickOpenMode.OPEN) {
                return false;
            }
            run();
            return true;
        };
    }

    protected async selectBoard(board: Board): Promise<void> {
        const allPorts = this.availableBoards.filter(AvailableBoard.hasPort).map(({ port }) => port).sort(Port.compare);
        const toItem = (port: Port) => new QuickOpenItem<QuickOpenItemOptions>({
            label: Port.toString(port, { useLabel: true }),
            run: this.toRun(() => {
                this.boardsServiceClient.boardsConfig = {
                    selectedBoard: board,
                    selectedPort: port
                };
            })
        });
        const options = {
            placeholder: `Select a port for '${board.name}'. Press 'Enter' to confirm or 'Escape' to cancel.`,
            fuzzyMatchLabel: true
        }
        this.quickOpenService.open({
            onType: (lookFor, acceptor) => {
                const fuzzyFilter = this.fuzzyFilter(lookFor);
                acceptor(allPorts.filter(({ address }) => fuzzyFilter(address)).map(toItem));
            }
        }, options);
    }

    protected async setConfig(config: ConfigOption): Promise<void> {
        const toItem = (value: ConfigValue) => new QuickOpenItem<QuickOpenItemOptions>({
            label: value.label,
            iconClass: value.selected ? 'fa fa-check' : '',
            run: this.toRun(() => {
                if (!this.selectedBoard) {
                    this.logger.warn(`Could not alter the boards settings. No board selected. ${JSON.stringify(config)}`);
                    return;
                }
                if (!this.selectedBoard.fqbn) {
                    this.logger.warn(`Could not alter the boards settings. The selected board does not have a FQBN. ${JSON.stringify(this.selectedBoard)}`);
                    return;
                }
                const { fqbn } = this.selectedBoard;
                this.configStore.setSelected({
                    fqbn,
                    option: config.option,
                    selectedValue: value.value
                });
            })
        });
        const options = {
            placeholder: `Configure '${config.label}'. Press 'Enter' to confirm or 'Escape' to cancel.`,
            fuzzyMatchLabel: true
        }
        this.quickOpenService.open({
            onType: (lookFor, acceptor) => {
                const fuzzyFilter = this.fuzzyFilter(lookFor);
                acceptor(config.values
                    .filter(({ label }) => fuzzyFilter(label))
                    .sort((left, right) => naturalCompare(left.label, right.label))
                    .map(toItem));
            }
        }, options);
    }

}

export namespace BoardsQuickOpenService {
    export type Item = AvailableBoard & { port: Port } | Board.Detailed | ConfigOption;
}
