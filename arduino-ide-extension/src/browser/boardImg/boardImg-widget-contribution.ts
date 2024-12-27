/* eslint-disable prettier/prettier */
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandRegistry, CommandService } from '@theia/core/lib/common/command';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { BoardImgWidget } from './boardImg-widget';
import { MainMenuManager } from '../../common/main-menu-manager';
import { MenuModelRegistry } from '@theia/core/lib/common/menu/menu-model-registry';
import { ApplicationShell } from '../theia/core/application-shell';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { toArray } from '@theia/core/shared/@phosphor/algorithm';
import { WorkspaceService } from '../theia/workspace/workspace-service';
import { SketchesService } from '../../common/protocol/sketches-service';

@injectable()
export class BoardImgWidgetContribution
    extends AbstractViewContribution<BoardImgWidget>
    implements FrontendApplicationContribution {
    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    @inject(ApplicationShell)
    protected readonly shelloverride: ApplicationShell;

    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    @inject(CommandService)
    private readonly commandService: CommandService;

    @inject(SketchesService)
    private readonly sketchesService: SketchesService;

    @inject(StorageService) protected storageService: StorageService;
    constructor() {
        super({
            widgetId: 'lingzhi-boardImg-widget',
            widgetName: BoardImgWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 1,
            },
            toggleCommandId: BoardImgWidgetCommand.id,
        });
    }

    onStart(): void {
        // 在应用启动时可以进行一些初始化操作，如果需要的话
    }

    async initializeLayout(): Promise<void> {
        return this.openView() as Promise<any>;
    }

    override registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(BoardImgWidgetCommand, {
            execute: () => {
                super.openView({ activate: false, reveal: true });
            },
        });
        commands.registerCommand(BoardImgWidgetClose, {
            execute: () => {
                super.closeView();
            },
        });

        let toHome = true;
        let leftPanelWidth: number | undefined;
        commands.registerCommand(MyWidgetCommandHome, {
            execute: async () => {
                if (!toHome) {
                    leftPanelWidth = this.shell.leftPanelHandler.getLayoutData().size;
                    toHome = true;
                }
                this.shelloverride.mainContainer.hide();
                this.shelloverride.rightPanelCustom.hide();
                this.shell.rightPanelHandler.container.hide();
            }
        });
        commands.registerCommand(MyWidgetCommandOther, {
            execute: async () => {
                this.shell.rightPanelHandler.container.hide();
                this.shell.leftPanelHandler.container.hide();
                this.shell.leftPanelHandler.container.show();
                if (toHome) {
                    toHome = false;
                    if (leftPanelWidth) {
                        this.shell.leftPanelHandler.resize(leftPanelWidth);
                    } else {
                        this.shell.leftPanelHandler.resize(160);
                    }
                }
                this.shelloverride.mainContainer.show();
                this.shelloverride.rightPanelCustom.show();
                this.shelloverride.rightPanelCustom.node.style.maxWidth = 'none';
            }
        });

        commands.registerCommand(MAIN_WIDGET_CLOSE_AND_OPEN, {
            execute: () => {
                const currentWidgetInMain = toArray(
                    this.shell.mainPanel.widgets()
                );
                if (currentWidgetInMain) {
                    currentWidgetInMain.forEach((widget) => {
                        widget.close();
                    })
                }
            }
        })
    }

    override registerMenus(registry: MenuModelRegistry): void {
        registry.unregisterMenuAction({
            commandId: BoardImgWidgetCommand.id,
        });
    }
}

export const BoardImgWidgetCommand = {
    id: 'toggle-lingzhi-boardImg-widget',
};

export const BoardImgWidgetClose = {
    id: 'close-lingzhi-boardImg-widget',
};

export const MAIN_WIDGET_CLOSE_AND_OPEN = { id: 'lingzhi-colse-and-open' };

export const MyWidgetCommandHome = { id: 'closeMainAndRight:command' };
export const MyWidgetCommandOther = { id: 'openMainAndRight:command' };