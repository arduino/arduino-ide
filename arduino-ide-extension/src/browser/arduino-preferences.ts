import { interfaces } from 'inversify';
import { createPreferenceProxy, PreferenceProxy, PreferenceService, PreferenceContribution, PreferenceSchema } from '@theia/core/lib/browser/preferences';
import { CompilerWarningLiterals, CompilerWarnings } from '../common/protocol';

export const ArduinoConfigSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        'arduino.language.log': {
            'type': 'boolean',
            'description': "True if the Arduino Language Server should generate log files into the sketch folder. Otherwise, false. It's false by default.",
            'default': false
        },
        'arduino.compile.verbose': {
            'type': 'boolean',
            'description': 'True for verbose compile output. False by default',
            'default': false
        },
        'arduino.compile.warnings': {
            'enum': [...CompilerWarningLiterals],
            'description': "Tells gcc which warning level to use. It's 'None' by default",
            'default': 'None'
        },
        'arduino.upload.verbose': {
            'type': 'boolean',
            'description': 'True for verbose upload output. False by default.',
            'default': false
        },
        'arduino.upload.verify': {
            'type': 'boolean',
            'default': false
        },
        'arduino.window.autoScale': {
            'type': 'boolean',
            'description': 'True if the user interface automatically scales with the font size.',
            'default': true
        },
        'arduino.window.zoomLevel': {
            'type': 'number',
            'description': 'Adjust the zoom level of the window. The original size is 0 and each increment above (e.g. 1) or below (e.g. -1) represents zooming 20% larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity.',
            'default': 0
        },
        'arduino.ide.autoUpdate': {
            'type': 'boolean',
            'description': 'True to enable automatic update checks. The IDE will check for updates automatically and periodically.',
            'default': true
        },
        'arduino.sketchbook.showAllFiles': {
            'type': 'boolean',
            'description': 'True to show all sketch files inside the sketch. It is false by default.',
            'default': false
        }
    }
};

export interface ArduinoConfiguration {
    'arduino.language.log': boolean;
    'arduino.compile.verbose': boolean;
    'arduino.compile.warnings': CompilerWarnings;
    'arduino.upload.verbose': boolean;
    'arduino.upload.verify': boolean;
    'arduino.window.autoScale': boolean;
    'arduino.window.zoomLevel': number;
    'arduino.ide.autoUpdate': boolean;
    'arduino.sketchbook.showAllFiles': boolean;
}

export const ArduinoPreferences = Symbol('ArduinoPreferences');
export type ArduinoPreferences = PreferenceProxy<ArduinoConfiguration>;

export function createArduinoPreferences(preferences: PreferenceService): ArduinoPreferences {
    return createPreferenceProxy(preferences, ArduinoConfigSchema);
}

export function bindArduinoPreferences(bind: interfaces.Bind): void {
    bind(ArduinoPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createArduinoPreferences(preferences);
    });
    bind(PreferenceContribution).toConstantValue({ schema: ArduinoConfigSchema });
}
