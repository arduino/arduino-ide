import { injectable } from 'inversify';
import { Argv, Arguments } from 'yargs';
import { CliContribution } from '@theia/core/lib/node';

@injectable()
export class ArduinoCliContribution implements CliContribution {

    protected _debugCli = false

    configure(conf: Argv): void {
        conf.option('debug-cli', {
            description: 'Can be specified if the CLI daemon process was started externally.',
            type: 'boolean',
            default: false,
            nargs: 1
        });
    }

    setArguments(args: Arguments): void {
        this._debugCli = args['debug-cli'];
    }

    get debugCli(): boolean {
        return this._debugCli;
    }

}
