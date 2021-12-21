import { interfaces } from 'inversify';
import {
  createPreferenceProxy,
  PreferenceProxy,
  PreferenceService,
  PreferenceContribution,
  PreferenceSchema,
} from '@theia/core/lib/browser/preferences';
import { nls } from '@theia/core/lib/common';
import { CompilerWarningLiterals, CompilerWarnings } from '../common/protocol';

export const ArduinoConfigSchema: PreferenceSchema = {
  type: 'object',
  properties: {
    'arduino.language.log': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/language.log',
        "True if the Arduino Language Server should generate log files into the sketch folder. Otherwise, false. It's false by default."
      ),
      default: false,
    },
    'arduino.compile.verbose': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/compile.verbose',
        'True for verbose compile output. False by default'
      ),
      default: false,
    },
    'arduino.compile.warnings': {
      enum: [...CompilerWarningLiterals],
      description: nls.localize(
        'arduino/preferences/compile.warnings',
        "Tells gcc which warning level to use. It's 'None' by default"
      ),
      default: 'None',
    },
    'arduino.upload.verbose': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/upload.verbose',
        'True for verbose upload output. False by default.'
      ),
      default: false,
    },
    'arduino.upload.verify': {
      type: 'boolean',
      default: false,
    },
    'arduino.window.autoScale': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/window.autoScale',
        'True if the user interface automatically scales with the font size.'
      ),
      default: true,
    },
    'arduino.window.zoomLevel': {
      type: 'number',
      description: nls.localize(
        'arduino/preferences/window.zoomLevel',
        'Adjust the zoom level of the window. The original size is 0 and each increment above (e.g. 1) or below (e.g. -1) represents zooming 20% larger or smaller. You can also enter decimals to adjust the zoom level with a finer granularity.'
      ),
      default: 0,
    },
    'arduino.ide.autoUpdate': {
      type: 'boolean',
      default: true,
      description: nls.localize(
        'arduino/preferences/ide.autoUpdate',
        'True to enable automatic updates'
      ),
    },
    'arduino.ide.updateChannel': {
      type: 'string',
      enum: ['latest', 'nightly', 'none'],
      default: 'none',
      description: nls.localize(
        'arduino/preferences/ide.updateChannel',
        'Release channel to get updated from. Latest is the stable release, nightly is the latest development build.'
      ),
    },
    'arduino.board.certificates': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/board.certificates',
        'List of certificates that can be uploaded to boards'
      ),
      default: '',
    },
    'arduino.sketchbook.showAllFiles': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/sketchbook.showAllFiles',
        'True to show all sketch files inside the sketch. It is false by default.'
      ),
      default: false,
    },
    'arduino.cloud.enabled': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/cloud.enabled',
        'True if the sketch sync functions are enabled. Defaults to true.'
      ),
      default: true,
    },
    'arduino.cloud.pull.warn': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/cloud.pull.warn',
        'True if users should be warned before pulling a cloud sketch. Defaults to true.'
      ),
      default: true,
    },
    'arduino.cloud.push.warn': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/cloud.push.warn',
        'True if users should be warned before pushing a cloud sketch. Defaults to true.'
      ),
      default: true,
    },
    'arduino.cloud.pushpublic.warn': {
      type: 'boolean',
      description: nls.localize(
        'arduino/preferences/cloud.pushpublic.warn',
        'True if users should be warned before pushing a public sketch to the cloud. Defaults to true.'
      ),
      default: true,
    },
    'arduino.cloud.sketchSyncEnpoint': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/cloud.sketchSyncEnpoint',
        'The endpoint used to push and pull sketches from a backend. By default it points to Arduino Cloud API.'
      ),
      default: 'https://api2.arduino.cc/create',
    },
    'arduino.auth.clientID': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/auth.clientID',
        'The OAuth2 client ID.'
      ),
      default: 'C34Ya6ex77jTNxyKWj01lCe1vAHIaPIo',
    },
    'arduino.auth.domain': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/auth.domain',
        'The OAuth2 domain.'
      ),
      default: 'login.arduino.cc',
    },
    'arduino.auth.audience': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/auth.audience',
        'The OAuth2 audience.'
      ),
      default: 'https://api.arduino.cc',
    },
    'arduino.auth.registerUri': {
      type: 'string',
      description: nls.localize(
        'arduino/preferences/auth.registerUri',
        'The URI used to register a new user.'
      ),
      default: 'https://auth.arduino.cc/login#/register',
    },
  },
};

export interface ArduinoConfiguration {
  'arduino.language.log': boolean;
  'arduino.compile.verbose': boolean;
  'arduino.compile.warnings': CompilerWarnings;
  'arduino.upload.verbose': boolean;
  'arduino.upload.verify': boolean;
  'arduino.window.autoScale': boolean;
  'arduino.window.zoomLevel': number;
  'arduino.window.autoUpdate': boolean;
  'arduino.ide.updateChannel': 'latest' | 'nightly' | 'none';
  'arduino.board.certificates': string;
  'arduino.sketchbook.showAllFiles': boolean;
  'arduino.cloud.enabled': boolean;
  'arduino.cloud.pull.warn': boolean;
  'arduino.cloud.push.warn': boolean;
  'arduino.cloud.pushpublic.warn': boolean;
  'arduino.cloud.sketchSyncEnpoint': string;
  'arduino.auth.clientID': string;
  'arduino.auth.domain': string;
  'arduino.auth.audience': string;
  'arduino.auth.registerUri': string;
}

export const ArduinoPreferences = Symbol('ArduinoPreferences');
export type ArduinoPreferences = PreferenceProxy<ArduinoConfiguration>;

export function bindArduinoPreferences(bind: interfaces.Bind): void {
  bind(ArduinoPreferences).toDynamicValue((ctx) => {
    const preferences = ctx.container.get<PreferenceService>(PreferenceService);
    return createPreferenceProxy(preferences, ArduinoConfigSchema);
  });
  bind(PreferenceContribution).toConstantValue({
    schema: ArduinoConfigSchema,
  });
}
