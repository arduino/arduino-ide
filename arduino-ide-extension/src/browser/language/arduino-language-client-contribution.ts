import { injectable } from 'inversify';
import { BaseLanguageClientContribution } from '@theia/languages/lib/browser';

@injectable()
export class ArduinoLanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = 'ino'
    readonly name = 'Arduino'

    protected get documentSelector(): string[] {
        return ['ino'];
    }

    protected get globPatterns() {
        return ['**/*.ino']
    }

}
