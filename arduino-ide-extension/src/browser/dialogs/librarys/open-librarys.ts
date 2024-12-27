/* eslint-disable prettier/prettier */
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    Command,
    CommandRegistry,
    SketchContribution,
} from '../../contributions/contribution';
import { LibrarysDialog } from './librarys-dialog';

@injectable()
export class OpenLibrarys extends SketchContribution {
    @inject(LibrarysDialog)
    private readonly librarysDialog: LibrarysDialog;

    override registerCommands(command: CommandRegistry): void {
        command.registerCommand(LIBRARYS_OPEN, {
            execute: async () => { await this.librarysDialog.open() },
        })
    }
}

export const LIBRARYS_OPEN: Command = {
    id: 'lingzhi-librarys-open',
}
