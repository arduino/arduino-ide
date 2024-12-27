/* eslint-disable prettier/prettier */
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    Command,
    CommandRegistry,
    SketchContribution,
} from '../../contributions/contribution';
import { KeymapsDialog } from './keymaps-dialog';

@injectable()
export class OpenKeymaps extends SketchContribution {
    @inject(KeymapsDialog)
    private readonly keymapsDialog: KeymapsDialog;

    override registerCommands(command: CommandRegistry): void {
        command.registerCommand(KEYMAPS_OPEN, {
            execute: async () => { await this.keymapsDialog.open() },
        })
    }
}

export const KEYMAPS_OPEN: Command = {
    id: 'lingzhi-keymaps-open',
}
