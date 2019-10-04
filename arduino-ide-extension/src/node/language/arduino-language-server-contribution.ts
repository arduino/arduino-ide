import * as which from 'which';
import * as os from 'os';
import { join, delimiter } from 'path';
import { injectable } from 'inversify';
import { BaseLanguageServerContribution, IConnection, LanguageServerStartOptions } from '@theia/languages/lib/node';
import { Board } from '../../common/protocol/boards-service';

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

    async start(clientConnection: IConnection, options: LanguageServerStartOptions): Promise<void> {
        const clangd = await this.resolveExecutable('clangd');
        const languageServer = await this.resolveExecutable('arduino-language-server');
        const cli = await this.resolveExecutable('arduino-cli');
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

    protected resolveExecutable(name: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const path = `${process.env.PATH}${delimiter}${join(__dirname, '..', '..', '..', 'build')}`;
            const suffix = os.platform() === 'win32' ? '.exe' : '';
            which(name + suffix, { path }, (err, execPath) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(execPath);
                }
            });
        });
    }
}
