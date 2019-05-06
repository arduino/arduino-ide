import { injectable } from 'inversify';
import { LanguageGrammarDefinitionContribution, TextmateRegistry } from '@theia/monaco/lib/browser/textmate';

@injectable()
export class ArduinoLanguageGrammarContribution implements LanguageGrammarDefinitionContribution {

    static INO_LANGUAGE_ID = 'ino';

    registerTextmateLanguage(registry: TextmateRegistry) {
        monaco.languages.register({
            id: ArduinoLanguageGrammarContribution.INO_LANGUAGE_ID,
            extensions: ['.ino'],
            aliases: ['INO', 'Ino', 'ino'],
        });

        monaco.languages.setLanguageConfiguration(ArduinoLanguageGrammarContribution.INO_LANGUAGE_ID, this.configuration);

        const inoGrammar = require('../../../data/ino.tmLanguage.json');
        registry.registerTextmateGrammarScope('source.ino', {
            async getGrammarDefinition() {
                return {
                    format: 'json',
                    content: inoGrammar
                };
            }
        });
        registry.mapLanguageIdToTextmateGrammar(ArduinoLanguageGrammarContribution.INO_LANGUAGE_ID, 'source.ino');
    }

    private readonly configuration: monaco.languages.LanguageConfiguration = {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '\'', close: '\'', notIn: ['string', 'comment'] },
            { open: '"', close: '"', notIn: ['string'] },
            { open: '/*', close: ' */', notIn: ['string'] }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        folding: {
            markers: {
                start: new RegExp('^\\s*#pragma\\s+region\\b'),
                end: new RegExp('^\\s*#pragma\\s+endregion\\b')
            }
        }
    };

}
