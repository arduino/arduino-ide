import * as os from 'os';
import { injectable, inject } from 'inversify';
import { ILogger } from '@theia/core';
import { BaseLanguageServerContribution, IConnection, LanguageServerStartOptions } from '@theia/languages/lib/node';
import { Board } from '../../common/protocol/boards-service';
import { getExecPath } from '../exec-util';

@injectable()
export class ArduinoLanguageServerContribution extends BaseLanguageServerContribution {

    readonly description = {
        id: 'ino',
        name: 'Arduino',
        documentSelector: ['ino'],
        fileEvents: ['**/*.ino']
    }

    get id() {
        return this.description.id;
    }

    get name() {
        return this.description.name;
    }

    @inject(ILogger)
    protected logger: ILogger;

    async start(clientConnection: IConnection, options: LanguageServerStartOptions): Promise<void> {
        const [languageServer, clangd, cli] = await Promise.all([
            getExecPath('arduino-language-server', this.onError.bind(this)),
            getExecPath('clangd', this.onError.bind(this), '--version', os.platform() !== 'win32'),
            getExecPath('arduino-cli', this.onError.bind(this), 'version')
        ]);
        // Add '-log' argument to enable logging to files
        const args: string[] = ['-clangd', clangd, '-cli', cli];
        if (options.parameters && options.parameters.selectedBoard) {
            const board = options.parameters.selectedBoard as Board;
            if (board.fqbn) {
                args.push('-fqbn', board.fqbn);
            }
            if (board.name) {
                args.push('-board-name', `"${board.name}"`);
            }
        }
        console.log(`Starting language server ${languageServer} ${args.join(' ')}`);
        const serverConnection = await this.createProcessStreamConnectionAsync(languageServer, args);
        this.forward(clientConnection, serverConnection);
    }

    protected onError(error: Error): void {
        this.logger.error(error);
    }

}
