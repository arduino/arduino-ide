import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Disable } from 'react-disable';
import { deepClone } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  CompilerWarningLiterals,
  Network,
  ProxySettings,
} from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';
import { Settings, SettingsService } from './settings';
import { AdditionalUrlsDialog } from './settings-dialog';
import { AsyncLocalizationProvider } from '@theia/core/lib/common/i18n/localization';

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
                'vscode/editorStatus/status.editor.mode',
                'Language'
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
              <select
                className="theia-select"
                value={this.state.currentLanguage}
                onChange={this.languageDidChange}
              >
                {this.state.languages.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              <span style={{ marginLeft: '5px' }}>
                (
                {nls.localize(
                  'vscode/extensionsActions/reloadRequired',
                  'Reload required'
                )}
                )
              </span>
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

  protected languageDidChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedLanguage = event.target.value;
    this.setState({ currentLanguage: selectedLanguage });
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
    readonly localizationProvider: AsyncLocalizationProvider;
  }
  export type State = Settings & { languages: string[] };
}
