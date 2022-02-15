import { injectable, inject, postConstruct } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { deepClone } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { PreferenceService, PreferenceScope } from '@theia/core/lib/browser';
import { Index } from '../../../common/types';
import {
  CompilerWarnings,
  ConfigService,
  FileSystemExt,
  Network,
} from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';
import { AsyncLocalizationProvider } from '@theia/core/lib/common/i18n/localization';

export const EDITOR_SETTING = 'editor';
export const FONT_SIZE_SETTING = `${EDITOR_SETTING}.fontSize`;
export const AUTO_SAVE_SETTING = `${EDITOR_SETTING}.autoSave`;
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

export interface Settings extends Index {
  editorFontSize: number; // `editor.fontSize`
  themeId: string; // `workbench.colorTheme`
  autoSave: 'on' | 'off'; // `editor.autoSave`
  quickSuggestions: Record<'other' | 'comments' | 'strings', boolean>; // `editor.quickSuggestions`

  languages: string[]; // `languages from the plugins`
  currentLanguage: string;

  autoScaleInterface: boolean; // `arduino.window.autoScale`
  interfaceScale: number; // `arduino.window.zoomLevel` https://github.com/eclipse-theia/theia/issues/8751
  verboseOnCompile: boolean; // `arduino.compile.verbose`
  compilerWarnings: CompilerWarnings; // `arduino.compile.warnings`
  verboseOnUpload: boolean; // `arduino.upload.verbose`
  verifyAfterUpload: boolean; // `arduino.upload.verify`
  sketchbookShowAllFiles: boolean; // `arduino.sketchbook.showAllFiles`

  sketchbookPath: string; // CLI
  additionalUrls: string[]; // CLI
  network: Network; // CLI
}
export namespace Settings {
  export function belongsToCli<K extends keyof Settings>(key: K): boolean {
    return key === 'sketchbookPath' || key === 'additionalUrls';
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

  protected readonly onDidChangeEmitter = new Emitter<Readonly<Settings>>();
  readonly onDidChange = this.onDidChangeEmitter.event;

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
        'arduino-theme'
      ),
      this.preferenceService.get<'on' | 'off'>(AUTO_SAVE_SETTING, 'on'),
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
      themeId,
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
      this._settings[key] = settings[key];
    }
    if (fireDidChange) {
      this.onDidChangeEmitter.fire(this._settings);
    }
  }

  async reset(): Promise<void> {
    const settings = await this.loadSettings();
    return this.update(settings, true);
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

    await Promise.all([
      this.preferenceService.set(
        'editor.fontSize',
        editorFontSize,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        'workbench.colorTheme',
        themeId,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        'editor.autoSave',
        autoSave,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        'editor.quickSuggestions',
        quickSuggestions,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        AUTO_SCALE_SETTING,
        autoScaleInterface,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        ZOOM_LEVEL_SETTING,
        interfaceScale,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        COMPILE_VERBOSE_SETTING,
        verboseOnCompile,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        COMPILE_WARNINGS_SETTING,
        compilerWarnings,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        UPLOAD_VERBOSE_SETTING,
        verboseOnUpload,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        UPLOAD_VERIFY_SETTING,
        verifyAfterUpload,
        PreferenceScope.User
      ),
      this.preferenceService.set(
        SHOW_ALL_FILES_SETTING,
        sketchbookShowAllFiles,
        PreferenceScope.User
      ),
      this.configService.setConfiguration(config),
    ]);
    this.onDidChangeEmitter.fire(this._settings);

    // after saving all the settings, if we need to change the language we need to perform a reload
    if (currentLanguage !== nls.locale) {
      window.localStorage.setItem(nls.localeId, currentLanguage);
      window.location.reload();
    }

    return true;
  }
}
