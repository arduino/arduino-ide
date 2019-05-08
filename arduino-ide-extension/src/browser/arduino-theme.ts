
import { Theme } from '@theia/core/lib/browser/theming';
import { MonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';

const ARDUINO_CSS = require('../../src/browser/style/arduino.useable.css');
const ARDUINO_JSON = MonacoThemeRegistry.SINGLETON.register(
    require('../../src/browser/data/arduino.color-theme.json'), {}, 'arduino', 'vs').name!;

export class ArduinoTheme {

    static readonly arduino: Theme = {
        id: 'arduino-theme',
        label: 'Arduino Light Theme',
        description: 'Arduino Light Theme',
        editorTheme: ARDUINO_JSON,
        activate() {
            ARDUINO_CSS.use();
        },
        deactivate() {
            ARDUINO_CSS.unuse();
        }
    }

    static readonly themes: Theme[] = [
        ArduinoTheme.arduino
    ]
}