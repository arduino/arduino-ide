import {
  PreferenceContribution,
  PreferenceProxy,
  PreferenceSchema,
  PreferenceService,
  createPreferenceProxy,
} from '@theia/core/lib/browser/preferences';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { nls } from '@theia/core/lib/common/nls';
import { PreferenceSchemaProperty } from '@theia/core/lib/common/preferences/preference-schema';
import { interfaces } from '@theia/core/shared/inversify';
import { serialMonitorWidgetLabel } from '../common/nls';
import { CompilerWarningLiterals, CompilerWarnings } from '../common/protocol';

export enum UpdateChannel {
  Stable = 'stable',
  Nightly = 'nightly',
}
export const ErrorRevealStrategyLiterals = [
  /**
   * Scroll vertically as necessary and reveal a line.
   */
  'auto',
  /**
   * Scroll vertically as necessary and reveal a line centered vertically.
   */
  'center',
  /**
   * Scroll vertically as necessary and reveal a line close to the top of the viewport, optimized for viewing a code definition.
   */
  'top',
  /**
   * Scroll vertically as necessary and reveal a line centered vertically only if it lies outside the viewport.
   */
  'centerIfOutsideViewport',
] as const;
export type ErrorRevealStrategy = (typeof ErrorRevealStrategyLiterals)[number];
export namespace ErrorRevealStrategy {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  export function is(arg: any): arg is ErrorRevealStrategy {
    return !!arg && ErrorRevealStrategyLiterals.includes(arg);
  }
  export const Default: ErrorRevealStrategy = 'centerIfOutsideViewport';
}

export type MonitorWidgetDockPanel = Extract<
  ApplicationShell.Area,
  'bottom' | 'right'
>;
export const defaultMonitorWidgetDockPanel: MonitorWidgetDockPanel = 'bottom';
export function isMonitorWidgetDockPanel(
  arg: unknown
): arg is MonitorWidgetDockPanel {
  return arg === 'bottom' || arg === 'right';
}

type StrictPreferenceSchemaProperties<T extends object> = {
  [p in keyof T]: PreferenceSchemaProperty;
};
type ArduinoPreferenceSchemaProperties =
  StrictPreferenceSchemaProperties<ArduinoConfiguration> & { 'arduino.window.zoomLevel': PreferenceSchemaProperty };

const properties: ArduinoPreferenceSchemaProperties = {
  'arduino.language.log': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/language.log',
      "True if the Arduino Language Server should generate log files into the sketch folder. Otherwise, false. It's false by default."
    ),
    default: false,
  },
  'arduino.language.realTimeDiagnostics': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/language.realTimeDiagnostics',
      "If true, the language server provides real-time diagnostics when typing in the editor. It's false by default."
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
  'arduino.compile.experimental': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/compile.experimental',
      'True if the IDE should handle multiple compiler errors. False by default'
    ),
    default: false,
  },
  'arduino.compile.revealRange': {
    enum: [...ErrorRevealStrategyLiterals],
    description: nls.localize(
      'arduino/preferences/compile.revealRange',
      "Adjusts how compiler errors are revealed in the editor after a failed verify/upload. Possible values: 'auto': Scroll vertically as necessary and reveal a line. 'center': Scroll vertically as necessary and reveal a line centered vertically. 'top': Scroll vertically as necessary and reveal a line close to the top of the viewport, optimized for viewing a code definition. 'centerIfOutsideViewport': Scroll vertically as necessary and reveal a line centered vertically only if it lies outside the viewport. The default value is '{0}'.",
      ErrorRevealStrategy.Default
    ),
    default: ErrorRevealStrategy.Default,
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
    description: '',
    default: 0,
    deprecationMessage: nls.localize(
      'arduino/preferences/window.zoomLevel/deprecationMessage',
      "Deprecated. Use 'window.zoomLevel' instead."
    ),
  },
  'arduino.ide.updateChannel': {
    type: 'string',
    enum: Object.values(UpdateChannel) as UpdateChannel[],
    default: UpdateChannel.Stable,
    description: nls.localize(
      'arduino/preferences/ide.updateChannel',
      "Release channel to get updated from. 'stable' is the stable release, 'nightly' is the latest development build."
    ),
  },
  'arduino.ide.updateBaseUrl': {
    type: 'string',
    default: 'https://downloads.arduino.cc/arduino-ide',
    description: nls.localize(
      'arduino/preferences/ide.updateBaseUrl',
      "The base URL where to download updates from. Defaults to 'https://downloads.arduino.cc/arduino-ide'"
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
  'arduino.cloud.sketchSyncEndpoint': {
    type: 'string',
    description: nls.localize(
      'arduino/preferences/cloud.sketchSyncEndpoint',
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
  'arduino.survey.notification': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/survey.notification',
      'True if users should be notified if a survey is available. True by default.'
    ),
    default: true,
  },
  'arduino.cli.daemon.debug': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/cli.daemonDebug',
      "Enable debug logging of the gRPC calls to the Arduino CLI. A restart of the IDE is needed for this setting to take effect. It's false by default."
    ),
    default: false,
  },
  'arduino.checkForUpdates': {
    type: 'boolean',
    description: nls.localize(
      'arduino/preferences/checkForUpdate',
      "Receive notifications of available updates for the IDE, boards, and libraries. Requires an IDE restart after change. It's true by default."
    ),
    default: true,
  },
  'arduino.sketch.inoBlueprint': {
    type: 'string',
    markdownDescription: nls.localize(
      'arduino/preferences/sketch/inoBlueprint',
      'Absolute filesystem path to the default `.ino` blueprint file. If specified, the content of the blueprint file will be used for every new sketch created by the IDE. The sketches will be generated with the default Arduino content if not specified. Unaccessible blueprint files are ignored. **A restart of the IDE is needed** for this setting to take effect.'
    ),
    default: undefined,
  },
  'arduino.monitor.dockPanel': {
    type: 'string',
    enum: ['bottom', 'right'],
    markdownDescription: nls.localize(
      'arduino/preferences/monitor/dockPanel',
      'The area of the application shell where the _{0}_ widget will reside. It is either "bottom" or "right". It defaults to "{1}".',
      serialMonitorWidgetLabel,
      defaultMonitorWidgetDockPanel
    ),
    default: defaultMonitorWidgetDockPanel,
  },
};
export const ArduinoConfigSchema: PreferenceSchema = {
  type: 'object',
  properties,
};

export interface ArduinoConfiguration {
  'arduino.language.log': boolean;
  'arduino.language.realTimeDiagnostics': boolean;
  'arduino.compile.verbose': boolean;
  'arduino.compile.experimental': boolean;
  'arduino.compile.revealRange': ErrorRevealStrategy;
  'arduino.compile.warnings': CompilerWarnings;
  'arduino.upload.verbose': boolean;
  'arduino.upload.verify': boolean;
  'arduino.window.autoScale': boolean;
  'arduino.ide.updateChannel': UpdateChannel;
  'arduino.ide.updateBaseUrl': string;
  'arduino.board.certificates': string;
  'arduino.sketchbook.showAllFiles': boolean;
  'arduino.cloud.enabled': boolean;
  'arduino.cloud.pull.warn': boolean;
  'arduino.cloud.push.warn': boolean;
  'arduino.cloud.pushpublic.warn': boolean;
  'arduino.cloud.sketchSyncEndpoint': string;
  'arduino.auth.clientID': string;
  'arduino.auth.domain': string;
  'arduino.auth.audience': string;
  'arduino.auth.registerUri': string;
  'arduino.survey.notification': boolean;
  'arduino.cli.daemon.debug': boolean;
  'arduino.sketch.inoBlueprint': string;
  'arduino.checkForUpdates': boolean;
  'arduino.monitor.dockPanel': MonitorWidgetDockPanel;
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
