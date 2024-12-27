/* eslint-disable prettier/prettier */
import { MenuModelRegistry } from '@theia/core';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { OutputContextMenu } from '@theia/output/lib/browser/output-context-menu';
import { quickCommand } from '@theia/core/lib/browser';

export class MyOutputContribution extends OutputContribution {
    override registerMenus(registry: MenuModelRegistry): void {
        super.registerMenus(registry);
        registry.unregisterMenuNode(OutputCommands.COPY_ALL.id);
        registry.unregisterMenuNode(quickCommand.id);
        registry.unregisterMenuNode(OutputCommands.CLEAR__WIDGET.id);

        registry.registerMenuAction(OutputContextMenu.TEXT_EDIT_GROUP, {
            commandId: OutputCommands.COPY_ALL.id,
            label: '复制全部',
        });
        // registry.registerMenuAction(OutputContextMenu.COMMAND_GROUP, {
        //     commandId: quickCommand.id,
        //     label: '命令面板...',
        // });
        registry.registerMenuAction(OutputContextMenu.WIDGET_GROUP, {
            commandId: OutputCommands.CLEAR__WIDGET.id,
            label: '清除输出',
        });
    }
}
