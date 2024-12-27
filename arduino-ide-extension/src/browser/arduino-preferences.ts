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

export const defaultAsyncWorkers = 0 as const;
export const minAsyncWorkers = defaultAsyncWorkers;
export const maxAsyncWorkers = 8 as const;

type StrictPreferenceSchemaProperties<T extends object> = {
  [p in keyof T]: PreferenceSchemaProperty;
};
type ArduinoPreferenceSchemaProperties =
  StrictPreferenceSchemaProperties<ArduinoConfiguration> & {
    'arduino.window.zoomLevel': PreferenceSchemaProperty;
  };

const properties: ArduinoPreferenceSchemaProperties = {
  'arduino.language.log': {
    type: 'boolean',
    description:
      'True 则 Arduino Language Server 将日志文件生成到项目文件夹中。默认为 False。',
    default: false,
  },
  'arduino.language.realTimeDiagnostics': {
    type: 'boolean',
    description:
      'True 则 language server 在编辑器中输入时提供实时诊断。默认为 False。',
    default: false,
  },
  'arduino.language.asyncWorkers': {
    type: 'number',
    description:
      'Arduino 语言服务器（clangd）使用的异步工作线程数。 后台索引也使用相同数量的工作线程。 最小值为 0，最大值为 8。 当值为 0 时，语言服务器将使用所有可用的核心。 默认值为 0。',
    minimum: minAsyncWorkers,
    maximum: maxAsyncWorkers,
    default: defaultAsyncWorkers,
  },
  'arduino.compile.verbose': {
    type: 'boolean',
    description: 'True 则输出详细编译信息。默认为 False',
    default: true,
  },
  'arduino.compile.experimental': {
    type: 'boolean',
    description: 'True 则 IDE 处理多个编译器错误。默认为 False。',
    default: false,
  },
  'arduino.compile.revealRange': {
    enum: [...ErrorRevealStrategyLiterals],
    description:
      '调整编译器错误在 “验证/上传” 失败后在编辑器中的显示方式。可能的值：‘auto’：根据需要垂直滚动并显示一行。‘center’：必要时垂直滚动并显示垂直居中的一行。‘top’：必要时垂直滚动并显示靠近视口顶部的一行，优化用于查看代码定义。‘centerIfOutsideViewport’：根据需要垂直滚动并显示垂直居中的线，只有当它位于视口之外时。',
    default: ErrorRevealStrategy.Default,
  },
  'arduino.compile.warnings': {
    enum: [...CompilerWarningLiterals],
    description: '设置 gcc 警告级别。默认为 None',
    default: 'None',
  },
  'arduino.upload.verbose': {
    type: 'boolean',
    description: 'True 则输出详细上传信息。默认情况下为 False。',
    default: true,
  },
  'arduino.upload.verify': {
    type: 'boolean',
    default: false,
  },
  'arduino.window.autoScale': {
    type: 'boolean',
    description: 'True 则用户界面随字体大小自动缩放。',
    default: true,
  },
  'arduino.window.zoomLevel': {
    type: 'number',
    description: '',
    default: 0,
    deprecationMessage: '已弃用。请改用“window.zoomLevel”。',
  },
  'arduino.ide.updateChannel': {
    type: 'string',
    enum: Object.values(UpdateChannel) as UpdateChannel[],
    default: UpdateChannel.Stable,
    description:
      '在发布频道中获取更新信息。‘stable’ 是稳定的版本，‘nightly’ 是最新的开发版本。',
  },
  'arduino.ide.updateBaseUrl': {
    type: 'string',
    default: 'https://www.zxjian.com/api/databook',
    description: '下载更新的网址。默认为 ‘https://www.zxjian.com/api/databook’',
  },
  'arduino.board.certificates': {
    type: 'string',
    description: '可上传到开发板的证书列表',
    default: '',
  },
  'arduino.sketchbook.showAllFiles': {
    type: 'boolean',
    description: 'True 则显示项目中的所有项目文件。默认情况下为 False。',
    default: false,
  },
  'arduino.cloud.enabled': {
    type: 'boolean',
    description: 'True 则启用项目同步功能。默认为 True。',
    default: true,
  },
  'arduino.cloud.pull.warn': {
    type: 'boolean',
    description: 'True 则在拉取 cloud 项目之前警告用户。默认为 True。',
    default: true,
  },
  'arduino.cloud.push.warn': {
    type: 'boolean',
    description: 'True 则在推送 cloud 项目之前警告用户。默认为 True。',
    default: true,
  },
  'arduino.cloud.pushpublic.warn': {
    type: 'boolean',
    description: 'True 则将公开项目推送到 cloud 中之前警告用户。默认为 True。',
    default: true,
  },
  'arduino.cloud.sketchSyncEndpoint': {
    type: 'string',
    description:
      '用于从后台推送项目的端点。默认情况下，它指向 Arduino Cloud API。',
    default: 'https://api2.arduino.cc/create',
  },
  'arduino.auth.clientID': {
    type: 'string',
    description: 'OAuth2 客户端 ID',
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
  'arduino.language.asyncWorkers': number;
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
