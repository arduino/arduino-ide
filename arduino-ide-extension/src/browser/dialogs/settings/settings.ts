import {
  injectable,
  inject,
  postConstruct,
} from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { Deferred, timeout } from '@theia/core/lib/common/promise-util';
import { deepClone } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { PreferenceService, PreferenceScope } from '@theia/core/lib/browser';
import {
  AdditionalUrls,
  CompilerWarnings,
  ConfigService,
  FileSystemExt,
  Network,
} from '../../../common/protocol';
import { CommandService, nls } from '@theia/core/lib/common';
import {
  AsyncLocalizationProvider,
  LanguageInfo,
} from '@theia/core/lib/common/i18n/localization';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';

export const EDITOR_SETTING = 'editor';
export const FONT_SIZE_SETTING = `${EDITOR_SETTING}.fontSize`;
export const AUTO_SAVE_SETTING = `files.autoSave`;
export const QUICK_SUGGESTIONS_SETTING = `${EDITOR_SETTING}.quickSuggestions`;
export const ARDUINO_SETTING = 'arduino';
export const WINDOW_SETTING = `${ARDUINO_SETTING}.window`;
export const COMPILE_SETTING = `${ARDUINO_SETTING}.compile`;
export const UPLOAD_SETTING = `${ARDUINO_SETTING}.upload`;
export const SKETCHBOOK_SETTING = `${ARDUINO_SETTING}.sketchbook`;
export const AUTO_SCALE_SETTING = `${WINDOW_SETTING}.autoScale`;
export const ZOOM_LEVEL_SETTING = `${WINDOW_SETTING}.zoomLevel`;
export const COMPILE_VERBOSE_SETTING = `${COMPILE_SETTING}.verbose`;
export const COMPILE_WARNINGS_SETTING = `${COMPILE_SETTING}.warnings`;
export const UPLOAD_VERBOSE_SETTING = `${UPLOAD_SETTING}.verbose`;
export const UPLOAD_VERIFY_SETTING = `${UPLOAD_SETTING}.verify`;
export const SHOW_ALL_FILES_SETTING = `${SKETCHBOOK_SETTING}.showAllFiles`;

export interface Settings {
  editorFontSize: number; // `editor.fontSize`
  themeId: string; // `workbench.colorTheme`
  autoSave: Settings.AutoSave; // `files.autoSave`
  quickSuggestions: Record<'other' | 'comments' | 'strings', boolean>; // `editor.quickSuggestions`

  languages: (string | LanguageInfo)[]; // `languages from the plugins`
  currentLanguage: string;

  autoScaleInterface: boolean; // `arduino.window.autoScale`
  interfaceScale: number; // `arduino.window.zoomLevel` https://github.com/eclipse-theia/theia/issues/8751
  verboseOnCompile: boolean; // `arduino.compile.verbose`
  compilerWarnings: CompilerWarnings; // `arduino.compile.warnings`
  verboseOnUpload: boolean; // `arduino.upload.verbose`
  verifyAfterUpload: boolean; // `arduino.upload.verify`
  sketchbookShowAllFiles: boolean; // `arduino.sketchbook.showAllFiles`

  sketchbookPath: string; // CLI
  additionalUrls: AdditionalUrls; // CLI
  network: Network; // CLI
}
export namespace Settings {
  export function belongsToCli<K extends keyof Settings>(key: K): boolean {
    return key === 'sketchbookPath' || key === 'additionalUrls';
  }
  export type AutoSave =
    | 'off'
    | 'afterDelay'
    | 'onFocusChange'
    | 'onWindowChange';
  export namespace AutoSave {
    export const DEFAULT_ON: AutoSave = 'afterDelay'; // https://github.com/eclipse-theia/theia/issues/10812
  }
}

@injectable()
export class SettingsService {
  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(FileSystemExt)
  protected readonly fileSystemExt: FileSystemExt;

  @inject(ConfigService)
  protected readonly configService: ConfigService;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  @inject(AsyncLocalizationProvider)
  protected readonly localizationProvider: AsyncLocalizationProvider;

  @inject(CommandService)
  protected commandService: CommandService;

  protected readonly onDidChangeEmitter = new Emitter<Readonly<Settings>>();
  readonly onDidChange = this.onDidChangeEmitter.event;
  protected readonly onDidResetEmitter = new Emitter<Readonly<Settings>>();
  readonly onDidReset = this.onDidResetEmitter.event;

  protected ready = new Deferred<void>();
  protected _settings: Settings;

  @postConstruct()
  protected async init(): Promise<void> {
    const settings = await this.loadSettings();
    this._settings = deepClone(settings);
    this.ready.resolve();
  }

  protected async loadSettings(): Promise<Settings> {
    await this.preferenceService.ready;
    const [
      languages,
      currentLanguage,
      editorFontSize,
      themeId,
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      verboseOnCompile,
      compilerWarnings,
      verboseOnUpload,
      verifyAfterUpload,
      sketchbookShowAllFiles,
      cliConfig,
    ] = await Promise.all([
      ['en', ...(await this.localizationProvider.getAvailableLanguages())],
      this.localizationProvider.getCurrentLanguage(),
      this.preferenceService.get<number>(FONT_SIZE_SETTING, 12),
      this.preferenceService.get<string>(
        'workbench.colorTheme',
        window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'arduino-theme-dark'
          : 'arduino-theme'
      ),
      this.preferenceService.get<Settings.AutoSave>(
        AUTO_SAVE_SETTING,
        Settings.AutoSave.DEFAULT_ON
      ),
      this.preferenceService.get<
        Record<'other' | 'comments' | 'strings', boolean>
      >(QUICK_SUGGESTIONS_SETTING, {
        other: false,
        comments: false,
        strings: false,
      }),
      this.preferenceService.get<boolean>(AUTO_SCALE_SETTING, true),
      this.preferenceService.get<number>(ZOOM_LEVEL_SETTING, 0),
      this.preferenceService.get<boolean>(COMPILE_VERBOSE_SETTING, true),
      this.preferenceService.get<any>(COMPILE_WARNINGS_SETTING, 'None'),
      this.preferenceService.get<boolean>(UPLOAD_VERBOSE_SETTING, true),
      this.preferenceService.get<boolean>(UPLOAD_VERIFY_SETTING, true),
      this.preferenceService.get<boolean>(SHOW_ALL_FILES_SETTING, false),
      this.configService.getConfiguration(),
    ]);
    const { additionalUrls, sketchDirUri, network } = cliConfig;
    const sketchbookPath = await this.fileService.fsPath(new URI(sketchDirUri));
    return {
      editorFontSize,
      themeId: ThemeService.get().getCurrentTheme().id,
      languages,
      currentLanguage,
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      verboseOnCompile,
      compilerWarnings,
      verboseOnUpload,
      verifyAfterUpload,
      sketchbookShowAllFiles,
      additionalUrls,
      sketchbookPath,
      network,
    };
  }

  async settings(): Promise<Settings> {
    await this.ready.promise;
    return this._settings;
  }

  async update(settings: Settings, fireDidChange = false): Promise<void> {
    await this.ready.promise;
    for (const key of Object.keys(settings)) {
      if (key in this._settings) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._settings as any)[key] = (settings as any)[key];
      }
    }
    if (fireDidChange) {
      this.onDidChangeEmitter.fire(this._settings);
    }
  }

  async reset(): Promise<void> {
    const settings = await this.loadSettings();
    await this.update(settings, false);
    this.onDidResetEmitter.fire(this._settings);
  }

  async validate(
    settings: MaybePromise<Settings> = this.settings()
  ): Promise<string | true> {
    try {
      const { sketchbookPath, editorFontSize, themeId } = await settings;
      const sketchbookDir = await this.fileSystemExt.getUri(sketchbookPath);
      if (!(await this.fileService.exists(new URI(sketchbookDir)))) {
        return nls.localize(
          'arduino/preferences/invalid.sketchbook.location',
          'Invalid sketchbook location: {0}',
          sketchbookPath
        );
      }
      if (editorFontSize <= 0) {
        return nls.localize(
          'arduino/preferences/invalid.editorFontSize',
          'Invalid editor font size. It must be a positive integer.'
        );
      }
      if (
        !ThemeService.get()
          .getThemes()
          .find(({ id }) => id === themeId)
      ) {
        return nls.localize(
          'arduino/preferences/invalid.theme',
          'Invalid theme.'
        );
      }
      return true;
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      }
      return String(err);
    }
  }

  private async savePreference(name: string, value: unknown): Promise<void> {
    await this.preferenceService.set(name, value, PreferenceScope.User);
    await timeout(5);
  }

  async save(): Promise<string | true> {
    await this.ready.promise;
    const {
      currentLanguage,
      editorFontSize,
      themeId,
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      verboseOnCompile,
      compilerWarnings,
      verboseOnUpload,
      verifyAfterUpload,
      sketchbookPath,
      additionalUrls,
      network,
      sketchbookShowAllFiles,
    } = this._settings;
    const [config, sketchDirUri] = await Promise.all([
      this.configService.getConfiguration(),
      this.fileSystemExt.getUri(sketchbookPath),
    ]);
    (config as any).additionalUrls = additionalUrls;
    (config as any).sketchDirUri = sketchDirUri;
    (config as any).network = network;
    (config as any).locale = currentLanguage;

    await this.savePreference('editor.fontSize', editorFontSize);
    await this.savePreference('workbench.colorTheme', themeId);
    await this.savePreference(AUTO_SAVE_SETTING, autoSave);
    await this.savePreference('editor.quickSuggestions', quickSuggestions);
    await this.savePreference(AUTO_SCALE_SETTING, autoScaleInterface);
    await this.savePreference(ZOOM_LEVEL_SETTING, interfaceScale);
    await this.savePreference(ZOOM_LEVEL_SETTING, interfaceScale);
    await this.savePreference(COMPILE_VERBOSE_SETTING, verboseOnCompile);
    await this.savePreference(COMPILE_WARNINGS_SETTING, compilerWarnings);
    await this.savePreference(UPLOAD_VERBOSE_SETTING, verboseOnUpload);
    await this.savePreference(UPLOAD_VERIFY_SETTING, verifyAfterUpload);
    await this.savePreference(SHOW_ALL_FILES_SETTING, sketchbookShowAllFiles);
    await this.configService.setConfiguration(config);
    this.onDidChangeEmitter.fire(this._settings);

    // after saving all the settings, if we need to change the language we need to perform a reload
    // Only reload if the language differs from the current locale. `nls.locale === undefined` signals english as well
    if (
      currentLanguage !== (await this.localizationProvider.getCurrentLanguage())
    ) {
      await this.localizationProvider.setCurrentLanguage(currentLanguage);
      if (currentLanguage === 'en') {
        window.localStorage.removeItem(nls.localeId);
      } else {
        window.localStorage.setItem(nls.localeId, currentLanguage);
      }
      this.commandService.executeCommand(ElectronCommands.RELOAD.id);
    }

    return true;
  }
}
