import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { ThemeService } from '@theia/core/lib/browser/theming';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { deepClone } from '@theia/core/lib/common/objects';
import { wait } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
  MonacoThemeState,
  deleteTheme as deleteThemeFromIndexedDB,
  getThemes as getThemesFromIndexedDB,
} from '@theia/monaco/lib/browser/monaco-indexed-db';
import {
  MonacoTheme,
  MonacoThemingService as TheiaMonacoThemingService,
} from '@theia/monaco/lib/browser/monaco-theming-service';
import { MonacoThemeRegistry as TheiaMonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';
import type { ThemeMix } from '@theia/monaco/lib/browser/textmate/monaco-theme-types';
import { HostedPluginSupport } from '../../hosted/hosted-plugin-support';
import { ArduinoThemes, compatibleBuiltInTheme } from '../core/theming';
import { WindowServiceExt } from '../core/window-service-ext';

type MonacoThemeRegistrationSource =
  /**
   * When reading JS/TS contributed theme from a JSON file. Such as the Arduino themes and the ones contributed by Theia.
   */
  | 'compiled'
  /**
   * When reading and registering previous monaco themes from the `indexedDB`.
   */
  | 'indexedDB'
  /**
   * Contributed by VS Code extensions when starting the app and loading the plugins.
   */
  | 'vsix';

@injectable()
export class ThemesRegistrationSummary {
  private readonly _summary: Record<MonacoThemeRegistrationSource, string[]> = {
    compiled: [],
    indexedDB: [],
    vsix: [],
  };

  add(source: MonacoThemeRegistrationSource, themeId: string): void {
    const themeIds = this._summary[source];
    if (!themeIds.includes(themeId)) {
      themeIds.push(themeId);
    }
  }

  get summary(): Record<MonacoThemeRegistrationSource, string[]> {
    return deepClone(this._summary);
  }
}

@injectable()
export class MonacoThemeRegistry extends TheiaMonacoThemeRegistry {
  @inject(ThemesRegistrationSummary)
  private readonly summary: ThemesRegistrationSummary;

  private initializing = false;

  override initializeDefaultThemes(): void {
    this.initializing = true;
    try {
      super.initializeDefaultThemes();
    } finally {
      this.initializing = false;
    }
  }

  override setTheme(name: string, data: ThemeMix): void {
    super.setTheme(name, data);
    if (this.initializing) {
      this.summary.add('compiled', name);
    }
  }
}

@injectable()
export class MonacoThemingService extends TheiaMonacoThemingService {
  @inject(ThemesRegistrationSummary)
  private readonly summary: ThemesRegistrationSummary;

  private themeRegistrationSource: MonacoThemeRegistrationSource | undefined;

  protected override async restore(): Promise<void> {
    // The custom theme registration must happen before restoring the themes.
    // Otherwise, theme changes are not picked up.
    // https://github.com/arduino/arduino-ide/issues/1251#issuecomment-1436737702
    this.registerArduinoThemes();
    this.themeRegistrationSource = 'indexedDB';
    try {
      await super.restore();
    } finally {
      this.themeRegistrationSource = 'indexedDB';
    }
  }

  private registerArduinoThemes(): void {
    const { light, dark } = ArduinoThemes;
    this.registerParsedTheme({
      id: light.id,
      label: light.label,
      uiTheme: 'vs',
      json: require('../../../../src/browser/data/default.color-theme.json'),
    });
    this.registerParsedTheme({
      id: dark.id,
      label: dark.label,
      uiTheme: 'vs-dark',
      json: require('../../../../src/browser/data/dark.color-theme.json'),
    });
  }

  protected override doRegisterParsedTheme(
    state: MonacoThemeState
  ): Disposable {
    const themeId = state.id;
    const source = this.themeRegistrationSource ?? 'compiled';
    const disposable = super.doRegisterParsedTheme(state);
    this.summary.add(source, themeId);
    return disposable;
  }

  protected override async doRegister(
    theme: MonacoTheme,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pending: { [uri: string]: Promise<any> },
    toDispose: DisposableCollection
  ): Promise<void> {
    try {
      this.themeRegistrationSource = 'vsix';
      await super.doRegister(theme, pending, toDispose);
    } finally {
      this.themeRegistrationSource = undefined;
    }
  }
}

/**
 * Workaround for removing VSIX themes from the indexedDB if they were not loaded during the app startup.
 */
@injectable()
export class CleanupObsoleteThemes implements FrontendApplicationContribution {
  @inject(HostedPluginSupport)
  private readonly hostedPlugin: HostedPluginSupport;
  @inject(ThemesRegistrationSummary)
  private readonly summary: ThemesRegistrationSummary;
  @inject(ThemeService)
  private readonly themeService: ThemeService;
  @inject(MessageService)
  private readonly messageService: MessageService;
  @inject(WindowServiceExt)
  private readonly windowService: WindowServiceExt;

  onStart(): void {
    this.hostedPlugin.didStart.then(() => this.cleanupObsoleteThemes());
  }

  private async cleanupObsoleteThemes(): Promise<void> {
    const persistedThemes = await getThemesFromIndexedDB();
    const obsoleteThemeIds = collectObsoleteThemeIds(
      persistedThemes,
      this.summary.summary
    );
    if (!obsoleteThemeIds.length) {
      return;
    }
    const firstWindow = await this.windowService.isFirstWindow();
    if (firstWindow) {
      await this.removeObsoleteThemesFromIndexedDB(obsoleteThemeIds);
      this.unregisterObsoleteThemes(obsoleteThemeIds);
    }
  }

  private removeObsoleteThemesFromIndexedDB(themeIds: string[]): Promise<void> {
    return themeIds.reduce(async (previousTask, themeId) => {
      await previousTask;
      return deleteThemeFromIndexedDB(themeId);
    }, Promise.resolve());
  }

  private unregisterObsoleteThemes(themeIds: string[]): void {
    const currentTheme = this.themeService.getCurrentTheme();
    const switchToCompatibleTheme = themeIds.includes(currentTheme.id);
    for (const themeId of themeIds) {
      delete this.themeService['themes'][themeId];
    }
    this.themeService['doUpdateColorThemePreference']();
    if (switchToCompatibleTheme) {
      this.themeService.setCurrentTheme(
        compatibleBuiltInTheme(currentTheme).id,
        true
      );
      wait(250).then(() =>
        requestAnimationFrame(() =>
          this.messageService.info(
            nls.localize(
              'arduino/theme/currentThemeNotFound',
              '找不到当前选定的主题：{0}。LingZhiLab IDE选择了一个内置主题与缺失的主题兼容。',
              currentTheme.label
            )
          )
        )
      );
    }
  }
}

/**
 * An indexedDB registered theme is obsolete if it is in the indexedDB but was registered
 * from neither a `vsix` nor `compiled` source during the app startup.
 */
export function collectObsoleteThemeIds(
  indexedDBThemes: MonacoThemeState[],
  summary: Record<MonacoThemeRegistrationSource, string[]>
): string[] {
  const vsixThemeIds = summary['vsix'];
  const compiledThemeIds = summary['compiled'];
  return indexedDBThemes
    .map(({ id }) => id)
    .filter(
      (id) => !vsixThemeIds.includes(id) && !compiledThemeIds.includes(id)
    );
}
