import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Disable } from 'react-disable';
import URI from '@theia/core/lib/common/uri';
import { Emitter } from '@theia/core/lib/common/event';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { deepClone } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { MaybePromise } from '@theia/core/lib/common/types';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  DialogProps,
  PreferenceService,
  PreferenceScope,
  DialogError,
  ReactWidget,
} from '@theia/core/lib/browser';
import { Index } from '../common/types';
import {
  CompilerWarnings,
  CompilerWarningLiterals,
  ConfigService,
  FileSystemExt,
  Network,
  ProxySettings,
} from '../common/protocol';
import { AbstractDialog } from './theia/dialogs/dialogs';
import { nls } from '@theia/core/lib/browser/nls';

const EDITOR_SETTING = 'editor';
const FONT_SIZE_SETTING = `${EDITOR_SETTING}.fontSize`;
const AUTO_SAVE_SETTING = `${EDITOR_SETTING}.autoSave`;
const QUICK_SUGGESTIONS_SETTING = `${EDITOR_SETTING}.quickSuggestions`;
const ARDUINO_SETTING = 'arduino';
const WINDOW_SETTING = `${ARDUINO_SETTING}.window`;
// const IDE_SETTING = `${ARDUINO_SETTING}.ide`;
const COMPILE_SETTING = `${ARDUINO_SETTING}.compile`;
const UPLOAD_SETTING = `${ARDUINO_SETTING}.upload`;
const SKETCHBOOK_SETTING = `${ARDUINO_SETTING}.sketchbook`;
const AUTO_SCALE_SETTING = `${WINDOW_SETTING}.autoScale`;
const ZOOM_LEVEL_SETTING = `${WINDOW_SETTING}.zoomLevel`;
// const AUTO_UPDATE_SETTING = `${IDE_SETTING}.autoUpdate`;
const COMPILE_VERBOSE_SETTING = `${COMPILE_SETTING}.verbose`;
const COMPILE_WARNINGS_SETTING = `${COMPILE_SETTING}.warnings`;
const UPLOAD_VERBOSE_SETTING = `${UPLOAD_SETTING}.verbose`;
const UPLOAD_VERIFY_SETTING = `${UPLOAD_SETTING}.verify`;
const SHOW_ALL_FILES_SETTING = `${SKETCHBOOK_SETTING}.showAllFiles`;

export interface Settings extends Index {
  editorFontSize: number; // `editor.fontSize`
  themeId: string; // `workbench.colorTheme`
  autoSave: 'on' | 'off'; // `editor.autoSave`
  quickSuggestions: Record<'other' | 'comments' | 'strings', boolean>; // `editor.quickSuggestions`

  autoScaleInterface: boolean; // `arduino.window.autoScale`
  interfaceScale: number; // `arduino.window.zoomLevel` https://github.com/eclipse-theia/theia/issues/8751
  checkForUpdates?: boolean; // `arduino.ide.autoUpdate`
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

  protected readonly onDidChangeEmitter = new Emitter<Readonly<Settings>>();
  readonly onDidChange = this.onDidChangeEmitter.event;

  protected ready = new Deferred<void>();
  protected _settings: Settings;

  @postConstruct()
  protected async init(): Promise<void> {
    await this.appStateService.reachedState('ready'); // Hack for https://github.com/eclipse-theia/theia/issues/8993
    const settings = await this.loadSettings();
    this._settings = deepClone(settings);
    this.ready.resolve();
  }

  protected async loadSettings(): Promise<Settings> {
    await this.preferenceService.ready;
    const [
      editorFontSize,
      themeId,
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      // checkForUpdates,
      verboseOnCompile,
      compilerWarnings,
      verboseOnUpload,
      verifyAfterUpload,
      sketchbookShowAllFiles,
      cliConfig,
    ] = await Promise.all([
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
      // this.preferenceService.get<string>(AUTO_UPDATE_SETTING, true),
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
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      // checkForUpdates,
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
      editorFontSize,
      themeId,
      autoSave,
      quickSuggestions,
      autoScaleInterface,
      interfaceScale,
      // checkForUpdates,
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
      // this.preferenceService.set(AUTO_UPDATE_SETTING, checkForUpdates, PreferenceScope.User),
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
    return true;
  }
}

export class SettingsComponent extends React.Component<
  SettingsComponent.Props,
  SettingsComponent.State
> {
  readonly toDispose = new DisposableCollection();

  constructor(props: SettingsComponent.Props) {
    super(props);
  }

  componentDidUpdate(
    _: SettingsComponent.Props,
    prevState: SettingsComponent.State
  ): void {
    if (
      this.state &&
      prevState &&
      JSON.stringify(this.state) !== JSON.stringify(prevState)
    ) {
      this.props.settingsService.update(this.state, true);
    }
  }

  componentDidMount(): void {
    this.props.settingsService
      .settings()
      .then((settings) => this.setState(settings));
    this.toDispose.push(
      this.props.settingsService.onDidChange((settings) =>
        this.setState(settings)
      )
    );
  }

  componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  render(): React.ReactNode {
    if (!this.state) {
      return <div />;
    }
    return (
      <Tabs>
        <TabList>
          <Tab>{nls.localize('vscode/settingsTree/settings', 'Settings')}</Tab>
          <Tab>{nls.localize('arduino/preferences/network', 'Network')}</Tab>
        </TabList>
        <TabPanel>{this.renderSettings()}</TabPanel>
        <TabPanel>{this.renderNetwork()}</TabPanel>
      </Tabs>
    );
  }

  protected renderSettings(): React.ReactNode {
    return (
      <div className="content noselect">
        {nls.localize(
          'arduino/preferences/sketchbook.location',
          'Sketchbook location'
        ) + ':'}
        <div className="flex-line">
          <input
            className="theia-input stretch"
            type="text"
            value={this.state.sketchbookPath}
            onChange={this.sketchpathDidChange}
          />
          <button
            className="theia-button shrink"
            onClick={this.browseSketchbookDidClick}
          >
            {nls.localize('arduino/preferences/browse', 'Browse')}
          </button>
        </div>
        <label className="flex-line">
          <input
            type="checkbox"
            checked={this.state.sketchbookShowAllFiles === true}
            onChange={this.sketchbookShowAllFilesDidChange}
          />
          {nls.localize(
            'arduino/preferences/files.inside.sketches',
            'Show files inside Sketches'
          )}
        </label>
        <div className="flex-line">
          <div className="column">
            <div className="flex-line">
              {nls.localize(
                'arduino/preferences/editorFontSize',
                'Editor font size'
              ) + ':'}
            </div>
            <div className="flex-line">
              {nls.localize(
                'arduino/preferences/interfaceScale',
                'Interface scale'
              ) + ':'}
            </div>
            <div className="flex-line">
              {nls.localize(
                'vscode/themes.contribution/selectTheme.label',
                'Theme'
              ) + ':'}
            </div>
            <div className="flex-line">
              {nls.localize(
                'arduino/preferences/showVerbose',
                'Show verbose output during'
              )}
            </div>
            <div className="flex-line">
              {nls.localize(
                'arduino/preferences/compilerWarnings',
                'Compiler warnings'
              )}
            </div>
          </div>
          <div className="column">
            <div className="flex-line">
              <input
                className="theia-input small"
                type="number"
                step={1}
                pattern="[0-9]+"
                onKeyDown={this.numbersOnlyKeyDown}
                value={this.state.editorFontSize}
                onChange={this.editorFontSizeDidChange}
              />
            </div>
            <div className="flex-line">
              <label className="flex-line">
                <input
                  type="checkbox"
                  checked={this.state.autoScaleInterface}
                  onChange={this.autoScaleInterfaceDidChange}
                />
                {nls.localize('arduino/preferences/automatic', 'Automatic')}
              </label>
              <input
                className="theia-input small with-margin"
                type="number"
                step={20}
                pattern="[0-9]+"
                onKeyDown={this.noopKeyDown}
                value={100 + this.state.interfaceScale * 20}
                onChange={this.interfaceScaleDidChange}
              />
              %
            </div>
            <div className="flex-line">
              <select
                className="theia-select"
                value={
                  ThemeService.get()
                    .getThemes()
                    .find(({ id }) => id === this.state.themeId)?.label ||
                  nls.localize('arduino/common/unknown', 'Unknown')
                }
                onChange={this.themeDidChange}
              >
                {ThemeService.get()
                  .getThemes()
                  .map(({ id, label }) => (
                    <option key={id} value={label}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-line">
              <label className="flex-line">
                <input
                  type="checkbox"
                  checked={this.state.verboseOnCompile}
                  onChange={this.verboseOnCompileDidChange}
                />
                {nls.localize('arduino/preferences/compile', 'compile')}
              </label>
              <label className="flex-line">
                <input
                  type="checkbox"
                  checked={this.state.verboseOnUpload}
                  onChange={this.verboseOnUploadDidChange}
                />
                {nls.localize('arduino/preferences/upload', 'upload')}
              </label>
            </div>
            <div className="flex-line">
              <select
                className="theia-select"
                value={this.state.compilerWarnings}
                onChange={this.compilerWarningsDidChange}
              >
                {CompilerWarningLiterals.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <label className="flex-line">
          <input
            type="checkbox"
            checked={this.state.verifyAfterUpload}
            onChange={this.verifyAfterUploadDidChange}
          />
          {nls.localize(
            'arduino/preferences/verifyAfterUpload',
            'Verify code after upload'
          )}
        </label>
        <label className="flex-line">
          <input
            type="checkbox"
            checked={this.state.checkForUpdates}
            onChange={this.checkForUpdatesDidChange}
            disabled={true}
          />
          {nls.localize(
            'arduino/preferences/checkForUpdates',
            'Check for updates on startup'
          )}
        </label>
        <label className="flex-line">
          <input
            type="checkbox"
            checked={this.state.autoSave === 'on'}
            onChange={this.autoSaveDidChange}
          />
          {nls.localize(
            'vscode/fileActions.contribution/miAutoSave',
            'Auto save'
          )}
        </label>
        <label className="flex-line">
          <input
            type="checkbox"
            checked={this.state.quickSuggestions.other === true}
            onChange={this.quickSuggestionsOtherDidChange}
          />
          {nls.localize(
            'arduino/preferences/editorQuickSuggestions',
            'Editor Quick Suggestions'
          )}
        </label>
        <div className="flex-line">
          {nls.localize(
            'arduino/preferences/additionalManagerURLs',
            'Additional boards manager URLs'
          ) + ':'}
          <input
            className="theia-input stretch with-margin"
            type="text"
            value={this.state.additionalUrls.join(',')}
            onChange={this.additionalUrlsDidChange}
          />
          <i
            className="fa fa-window-restore theia-button shrink"
            onClick={this.editAdditionalUrlDidClick}
          />
        </div>
      </div>
    );
  }

  protected renderNetwork(): React.ReactNode {
    return (
      <div className="content noselect">
        <form>
          <label className="flex-line">
            <input
              type="radio"
              checked={this.state.network === 'none'}
              onChange={this.noProxyDidChange}
            />
            {nls.localize('arduino/preferences/noProxy', 'No proxy')}
          </label>
          <label className="flex-line">
            <input
              type="radio"
              checked={this.state.network !== 'none'}
              onChange={this.manualProxyDidChange}
            />
            {nls.localize(
              'arduino/preferences/manualProxy',
              'Manual proxy configuration'
            )}
          </label>
        </form>
        {this.renderProxySettings()}
      </div>
    );
  }

  protected renderProxySettings(): React.ReactNode {
    const disabled = this.state.network === 'none';
    return (
      <Disable disabled={disabled}>
        <div className="proxy-settings" aria-disabled={disabled}>
          <form className="flex-line">
            <input
              type="radio"
              checked={
                this.state.network === 'none'
                  ? true
                  : this.state.network.protocol === 'http'
              }
              onChange={this.httpProtocolDidChange}
            />
            HTTP
            <label className="flex-line">
              <input
                type="radio"
                checked={
                  this.state.network === 'none'
                    ? false
                    : this.state.network.protocol !== 'http'
                }
                onChange={this.socksProtocolDidChange}
              />
              SOCKS
            </label>
          </form>
          <div className="flex-line proxy-settings">
            <div className="column">
              <div className="flex-line">Host name:</div>
              <div className="flex-line">Port number:</div>
              <div className="flex-line">Username:</div>
              <div className="flex-line">Password:</div>
            </div>
            <div className="column stretch">
              <div className="flex-line">
                <input
                  className="theia-input stretch with-margin"
                  type="text"
                  value={
                    this.state.network === 'none'
                      ? ''
                      : this.state.network.hostname
                  }
                  onChange={this.hostnameDidChange}
                />
              </div>
              <div className="flex-line">
                <input
                  className="theia-input small with-margin"
                  type="number"
                  pattern="[0-9]"
                  value={
                    this.state.network === 'none' ? '' : this.state.network.port
                  }
                  onKeyDown={this.numbersOnlyKeyDown}
                  onChange={this.portDidChange}
                />
              </div>
              <div className="flex-line">
                <input
                  className="theia-input stretch with-margin"
                  type="text"
                  value={
                    this.state.network === 'none'
                      ? ''
                      : this.state.network.username
                  }
                  onChange={this.usernameDidChange}
                />
              </div>
              <div className="flex-line">
                <input
                  className="theia-input stretch with-margin"
                  type="password"
                  value={
                    this.state.network === 'none'
                      ? ''
                      : this.state.network.password
                  }
                  onChange={this.passwordDidChange}
                />
              </div>
            </div>
          </div>
        </div>
      </Disable>
    );
  }

  private isControlKey(event: React.KeyboardEvent<HTMLInputElement>): boolean {
    return (
      !!event.key &&
      ['tab', 'delete', 'backspace', 'arrowleft', 'arrowright'].some(
        (key) => event.key.toLocaleLowerCase() === key
      )
    );
  }

  protected noopKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (this.isControlKey(event)) {
      return;
    }
    event.nativeEvent.preventDefault();
    event.nativeEvent.returnValue = false;
  };

  protected numbersOnlyKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (this.isControlKey(event)) {
      return;
    }
    const key = Number(event.key);
    if (isNaN(key) || event.key === null || event.key === ' ') {
      event.nativeEvent.preventDefault();
      event.nativeEvent.returnValue = false;
      return;
    }
  };

  protected browseSketchbookDidClick = async () => {
    const uri = await this.props.fileDialogService.showOpenDialog({
      title: nls.localize(
        'arduino/preferences/newSketchbookLocation',
        'Select new sketchbook location'
      ),
      openLabel: nls.localize('arduino/preferences/choose', 'Choose'),
      canSelectFiles: false,
      canSelectMany: false,
      canSelectFolders: true,
    });
    if (uri) {
      const sketchbookPath = await this.props.fileService.fsPath(uri);
      this.setState({ sketchbookPath });
    }
  };

  protected editAdditionalUrlDidClick = async () => {
    const additionalUrls = await new AdditionalUrlsDialog(
      this.state.additionalUrls,
      this.props.windowService
    ).open();
    if (additionalUrls) {
      this.setState({ additionalUrls });
    }
  };

  protected editorFontSizeDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    if (value) {
      this.setState({ editorFontSize: parseInt(value, 10) });
    }
  };

  protected additionalUrlsDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({
      additionalUrls: event.target.value.split(',').map((url) => url.trim()),
    });
  };

  protected autoScaleInterfaceDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ autoScaleInterface: event.target.checked });
  };

  protected interfaceScaleDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    const percentage = parseInt(value, 10);
    if (isNaN(percentage)) {
      return;
    }
    const interfaceScale = (percentage - 100) / 20;
    if (!isNaN(interfaceScale)) {
      this.setState({ interfaceScale });
    }
  };

  protected verifyAfterUploadDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ verifyAfterUpload: event.target.checked });
  };

  protected checkForUpdatesDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ checkForUpdates: event.target.checked });
  };

  protected sketchbookShowAllFilesDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ sketchbookShowAllFiles: event.target.checked });
  };

  protected autoSaveDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ autoSave: event.target.checked ? 'on' : 'off' });
  };

  protected quickSuggestionsOtherDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // need to persist react events through lifecycle https://reactjs.org/docs/events.html#event-pooling
    const newVal = event.target.checked ? true : false;

    this.setState((prevState) => {
      return {
        quickSuggestions: {
          ...prevState.quickSuggestions,
          other: newVal,
        },
      };
    });
  };

  protected themeDidChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { selectedIndex } = event.target.options;
    const theme = ThemeService.get().getThemes()[selectedIndex];
    if (theme) {
      this.setState({ themeId: theme.id });
    }
  };

  protected compilerWarningsDidChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { selectedIndex } = event.target.options;
    const compilerWarnings = CompilerWarningLiterals[selectedIndex];
    if (compilerWarnings) {
      this.setState({ compilerWarnings });
    }
  };

  protected verboseOnCompileDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ verboseOnCompile: event.target.checked });
  };

  protected verboseOnUploadDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    this.setState({ verboseOnUpload: event.target.checked });
  };

  protected sketchpathDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const sketchbookPath = event.target.value;
    if (sketchbookPath) {
      this.setState({ sketchbookPath });
    }
  };

  protected noProxyDidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      this.setState({ network: 'none' });
    } else {
      this.setState({ network: Network.Default() });
    }
  };

  protected manualProxyDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      this.setState({ network: Network.Default() });
    } else {
      this.setState({ network: 'none' });
    }
  };

  protected httpProtocolDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.protocol = event.target.checked ? 'http' : 'socks';
      this.setState({ network });
    }
  };

  protected socksProtocolDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.protocol = event.target.checked ? 'socks' : 'http';
      this.setState({ network });
    }
  };

  protected hostnameDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.hostname = event.target.value;
      this.setState({ network });
    }
  };

  protected portDidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.port = event.target.value;
      this.setState({ network });
    }
  };

  protected usernameDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.username = event.target.value;
      this.setState({ network });
    }
  };

  protected passwordDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.password = event.target.value;
      this.setState({ network });
    }
  };

  private get cloneProxySettings(): ProxySettings {
    const { network } = this.state;
    if (network === 'none') {
      throw new Error('Must be called when proxy is enabled.');
    }
    const copyNetwork = deepClone(network);
    return copyNetwork;
  }
}
export namespace SettingsComponent {
  export interface Props {
    readonly settingsService: SettingsService;
    readonly fileService: FileService;
    readonly fileDialogService: FileDialogService;
    readonly windowService: WindowService;
  }
  export type State = Settings;
}

@injectable()
export class SettingsWidget extends ReactWidget {
  @inject(SettingsService)
  protected readonly settingsService: SettingsService;

  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(FileDialogService)
  protected readonly fileDialogService: FileDialogService;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  protected render(): React.ReactNode {
    return (
      <SettingsComponent
        settingsService={this.settingsService}
        fileService={this.fileService}
        fileDialogService={this.fileDialogService}
        windowService={this.windowService}
      />
    );
  }
}

@injectable()
export class SettingsDialogProps extends DialogProps {}

@injectable()
export class SettingsDialog extends AbstractDialog<Promise<Settings>> {
  @inject(SettingsService)
  protected readonly settingsService: SettingsService;

  @inject(SettingsWidget)
  protected readonly widget: SettingsWidget;

  constructor(
    @inject(SettingsDialogProps)
    protected readonly props: SettingsDialogProps
  ) {
    super(props);
    this.contentNode.classList.add('arduino-settings-dialog');
    this.appendCloseButton(
      nls.localize('vscode/issueMainService/cancel', 'Cancel')
    );
    this.appendAcceptButton(nls.localize('vscode/issueMainService/ok', 'OK'));
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.push(
      this.settingsService.onDidChange(this.validate.bind(this))
    );
  }

  protected async isValid(settings: Promise<Settings>): Promise<DialogError> {
    const result = await this.settingsService.validate(settings);
    if (typeof result === 'string') {
      return result;
    }
    return '';
  }

  get value(): Promise<Settings> {
    return this.settingsService.settings();
  }

  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    this.toDisposeOnDetach.push(
      this.settingsService.onDidChange(() => this.update())
    );
    super.onAfterAttach(msg);
    this.update();
  }

  protected onUpdateRequest(msg: Message) {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);

    // calling settingsService.reset() in order to reload the settings from the preferenceService
    // and update the UI including changes triggerd from the command palette
    this.settingsService.reset();

    this.widget.activate();
  }
}

export class AdditionalUrlsDialog extends AbstractDialog<string[]> {
  protected readonly textArea: HTMLTextAreaElement;

  constructor(urls: string[], windowService: WindowService) {
    super({
      title: nls.localize(
        'arduino/preferences/additionalManagerURLs',
        'Additional Boards Manager URLs'
      ),
    });

    this.contentNode.classList.add('additional-urls-dialog');

    const description = document.createElement('div');
    description.textContent = nls.localize(
      'arduino/preferences/enterAdditionalURLs',
      'Enter additional URLs, one for each row'
    );
    description.style.marginBottom = '5px';
    this.contentNode.appendChild(description);

    this.textArea = document.createElement('textarea');
    this.textArea.className = 'theia-input';
    this.textArea.setAttribute('style', 'flex: 0;');
    this.textArea.value = urls
      .filter((url) => url.trim())
      .filter((url) => !!url)
      .join('\n');
    this.textArea.wrap = 'soft';
    this.textArea.cols = 90;
    this.textArea.rows = 5;
    this.contentNode.appendChild(this.textArea);

    const anchor = document.createElement('div');
    anchor.classList.add('link');
    anchor.textContent = nls.localize(
      'arduino/preferences/unofficialBoardSupport',
      'Click for a list of unofficial board support URLs'
    );
    anchor.style.marginTop = '5px';
    anchor.style.cursor = 'pointer';
    this.addEventListener(anchor, 'click', () =>
      windowService.openNewWindow(
        'https://github.com/arduino/Arduino/wiki/Unofficial-list-of-3rd-party-boards-support-urls',
        { external: true }
      )
    );
    this.contentNode.appendChild(anchor);

    this.appendAcceptButton(nls.localize('vscode/issueMainService/ok', 'OK'));
    this.appendCloseButton(
      nls.localize('vscode/issueMainService/cancel', 'Cancel')
    );
  }

  get value(): string[] {
    return this.textArea.value
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => !!url);
  }

  protected onAfterAttach(message: Message): void {
    super.onAfterAttach(message);
    this.addUpdateListener(this.textArea, 'input');
  }

  protected onActivateRequest(message: Message): void {
    super.onActivateRequest(message);
    this.textArea.focus();
  }

  protected handleEnter(event: KeyboardEvent): boolean | void {
    if (event.target instanceof HTMLInputElement) {
      return super.handleEnter(event);
    }
    return false;
  }
}
