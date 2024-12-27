import { Command } from '@theia/core/lib/common/command';

export namespace HomeCommands {
    export const OPEN_HOME = Command.toLocalizedCommand(
        {
            id: 'toggle-linzghi-home-widget',
            label: '打开主页',
        },
        'arduino/home/openHome'
    );
}
