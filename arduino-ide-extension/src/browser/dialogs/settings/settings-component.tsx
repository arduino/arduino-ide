import React from '@theia/core/shared/react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Disable } from 'react-disable';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { cn } from '../../lib/utils';
import { deepClone } from '@theia/core/lib/common/objects';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import {
  AdditionalUrls,
  CompilerWarningLiterals,
  Network,
  ProxySettings,
} from '../../../common/protocol';
import { nls } from '@theia/core/lib/common';
import { Settings, SettingsService } from './settings';
import { AdditionalUrlsDialog } from './settings-dialog';
import { AsyncLocalizationProvider } from '@theia/core/lib/common/i18n/localization';
import SettingsStepInput from './settings-step-input';
import { InterfaceScale } from '../../contributions/interface-scale';
import {
  userConfigurableThemes,
  themeLabelForSettings,
  arduinoThemeTypeOf,
} from '../../theia/core/theming';
import { Theme } from '@theia/core/lib/common/theme';

const maxScale = InterfaceScale.ZoomLevel.toPercentage(
  InterfaceScale.ZoomLevel.MAX
);
const minScale = InterfaceScale.ZoomLevel.toPercentage(
  InterfaceScale.ZoomLevel.MIN
);
const scaleStep = InterfaceScale.ZoomLevel.Step.toPercentage(
  InterfaceScale.ZoomLevel.STEP
);

const maxFontSize = InterfaceScale.FontSize.MAX;
const minFontSize = InterfaceScale.FontSize.MIN;
const fontSizeStep = InterfaceScale.FontSize.STEP;

// Common monospace fonts for the font family selector
const MONOSPACE_FONTS = [
  'Courier New',
  'Monaco',
  'Menlo',
  'Ubuntu Mono',
  'Consolas',
  'Source Code Pro',
  'Fira Code',
  'JetBrains Mono',
  'Roboto Mono',
  'Inconsolata',
  'Droid Sans Mono',
  'DejaVu Sans Mono',
  'Liberation Mono',
  'monospace',
];

export class SettingsComponent extends React.Component<
  SettingsComponent.Props,
  SettingsComponent.State
> {
  readonly toDispose = new DisposableCollection();

  constructor(props: SettingsComponent.Props) {
    super(props);
  }

  override componentDidUpdate(
    _: SettingsComponent.Props,
    prevState: SettingsComponent.State
  ): void {
    if (
      this.state &&
      prevState &&
      JSON.stringify(SettingsComponent.State.toSettings(this.state)) !==
        JSON.stringify(SettingsComponent.State.toSettings(prevState))
    ) {
      this.props.settingsService.update(
        SettingsComponent.State.toSettings(this.state),
        true
      );
    }
  }

  override componentDidMount(): void {
    this.props.settingsService
      .settings()
      .then((settings) =>
        this.setState(SettingsComponent.State.fromSettings(settings))
      );
    this.toDispose.pushAll([
      this.props.settingsService.onDidChange((settings) =>
        this.setState((prevState) => ({
          ...SettingsComponent.State.merge(prevState, settings),
        }))
      ),
      this.props.settingsService.onDidReset((settings) =>
        this.setState(SettingsComponent.State.fromSettings(settings))
      ),
    ]);
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  override render(): React.ReactNode {
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
    const scalePercentage = 100 + this.state.interfaceScale * 20;

    return (
      <div className={cn('content noselect p-6 space-y-6 bg-[var(--theia-editorWidget-background)]')}>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {nls.localize(
              'arduino/preferences/sketchbook.location',
              'Sketchbook location'
            )}
          </Label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              type="text"
              value={this.state.sketchbookPath}
              onChange={this.sketchpathDidChange}
            />
            <Button
              variant="outline"
              onClick={this.browseSketchbookDidClick}
            >
              {nls.localize('arduino/preferences/browse', 'Browse')}
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <Checkbox
              id="showAllFiles"
              checked={this.state.sketchbookShowAllFiles === true}
              onChange={this.sketchbookShowAllFilesDidChange}
            />
          <Label htmlFor="showAllFiles" className="cursor-pointer">
            {nls.localize(
              'arduino/preferences/files.inside.sketches',
              'Show files inside Sketches'
            )}
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'arduino/preferences/editorFontSize',
                  'Editor font size'
                )}
              </Label>
              <SettingsStepInput
                key={`font-size-stepper-${String(this.state.editorFontSize)}`}
                initialValue={this.state.editorFontSize}
                setSettingsStateValue={this.setFontSize}
                step={fontSizeStep}
                maxValue={maxFontSize}
                minValue={minFontSize}
                classNames={{ input: cn('h-10 w-20') }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'arduino/preferences/interfaceScale',
                  'Interface scale'
                )}
              </Label>
              <div className="flex items-center gap-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={this.state.autoScaleInterface}
                    onChange={this.autoScaleInterfaceDidChange}
                  />
                  <span className="text-sm">
                    {nls.localize('arduino/preferences/automatic', 'Automatic')}
                  </span>
                </label>
                <SettingsStepInput
                  key={`scale-stepper-${String(scalePercentage)}`}
                  initialValue={scalePercentage}
                  setSettingsStateValue={this.setInterfaceScale}
                  step={scaleStep}
                  maxValue={maxScale}
                  minValue={minScale}
                  unitOfMeasure="%"
                  classNames={{
                    input: cn('h-10 w-24'),
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'arduino/preferences/fontFamily',
                  'Font family'
                )}
              </Label>
              <Select
                value={this.getFontFamilyValue()}
                onValueChange={(value) => {
                  this.fontFamilyDidChange({
                    target: { value },
                  } as React.ChangeEvent<HTMLInputElement>);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONOSPACE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'vscode/themes.contribution/selectTheme.label',
                  'Theme'
                )}
              </Label>
              <Select
                value={this.currentThemeLabel}
                onValueChange={(value) => {
                  const groupedThemes = userConfigurableThemes(this.props.themeService);
                  let foundTheme: Theme | undefined;
                  for (const group of groupedThemes) {
                    foundTheme = group.find(
                      (t) => themeLabelForSettings(t) === value
                    );
                    if (foundTheme) break;
                  }
                  if (foundTheme) {
                    this.themeDidChange({
                      target: { value: foundTheme.id },
                    } as React.ChangeEvent<HTMLSelectElement>);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {this.separatedThemes
                    .filter((item): item is Theme => typeof item !== 'string')
                    .map((theme) => {
                      const label = themeLabelForSettings(theme);
                      return (
                        <SelectItem key={theme.id} value={label}>
                          {label}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'vscode/editorStatus/status.editor.mode',
                  'Language'
                )}
              </Label>
              <div className="space-y-1">
                <Select
                  value={this.state.currentLanguage}
                  onValueChange={(value) => {
                    this.languageDidChange({
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {this.state.languages.map((label) => {
                      const language =
                        typeof label === 'string' ? label : label.languageId;
                      const displayLabel =
                        typeof label === 'string'
                          ? label === 'en'
                            ? 'English'
                            : label
                          : label.localizedLanguageName ||
                            label.languageName ||
                            label.languageId;
                      return (
                        <SelectItem key={language} value={language}>
                          {displayLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  ({nls.localize(
                    'vscode/extensionsActions/reloadRequired',
                    'Reload required'
                  )})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'arduino/preferences/showVerbose',
                  'Show verbose output during'
                )}
              </Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={this.state.verboseOnCompile}
                    onChange={this.verboseOnCompileDidChange}
                  />
                  <span className="text-sm">compile</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={this.state.verboseOnUpload}
                    onChange={this.verboseOnUploadDidChange}
                  />
                  <span className="text-sm">upload</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {nls.localize(
                  'arduino/preferences/compilerWarnings',
                  'Compiler warnings'
                )}
              </Label>
              <Select
                value={String(this.state.compilerWarnings)}
                onValueChange={(value) => {
                  this.compilerWarningsDidChange({
                    target: { value },
                  } as React.ChangeEvent<HTMLSelectElement>);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CompilerWarningLiterals.map((warning) => (
                    <SelectItem key={warning} value={warning}>
                      {warning}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verifyAfterUpload"
              checked={this.state.verifyAfterUpload}
              onChange={this.verifyAfterUploadDidChange}
            />
            <Label htmlFor="verifyAfterUpload" className="cursor-pointer">
              {nls.localize(
                'arduino/preferences/verifyAfterUpload',
                'Verify code after upload'
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoSave"
              checked={this.state.autoSave !== 'off'}
              onChange={this.autoSaveDidChange}
            />
            <Label htmlFor="autoSave" className="cursor-pointer">
              {nls.localize('arduino/preferences/autoSave', 'Auto save')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="quickSuggestions"
              checked={this.state.quickSuggestions.other === true}
              onChange={this.quickSuggestionsOtherDidChange}
            />
            <Label htmlFor="quickSuggestions" className="cursor-pointer">
              {nls.localize(
                'arduino/preferences/quickSuggestions',
                'Editor Quick Suggestions'
              )}
            </Label>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {nls.localize(
                'arduino/preferences/additionalManagerURLs',
                'Additional boards manager URLs'
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                type="text"
                value={this.state.rawAdditionalUrlsValue}
                onChange={this.rawAdditionalUrlsValueDidChange}
                placeholder="https://..."
              />
              <Button
                variant="outline"
                onClick={this.editAdditionalUrlDidClick}
              >
                <span className="fa fa-window-restore" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private get currentThemeLabel(): string {
    const currentTheme = this.props.themeService.getCurrentTheme();
    return themeLabelForSettings(currentTheme);
  }

  private getFontFamilyValue(): string {
    // Extract the first font from the font family string (which might be a font stack)
    const fontFamily = this.state.editorFontFamily;
    if (!fontFamily) {
      return MONOSPACE_FONTS[0];
    }
    // Remove quotes and extract first font name
    const firstFont = fontFamily
      .replace(/['"]/g, '')
      .split(',')[0]
      .trim();
    // Check if it's in our list, otherwise return the first font
    return MONOSPACE_FONTS.includes(firstFont) ? firstFont : MONOSPACE_FONTS[0];
  }

  private get separatedThemes(): (Theme | string)[] {
    const separatedThemes: (Theme | string)[] = [];
    const groupedThemes = userConfigurableThemes(this.props.themeService);
    for (const group of groupedThemes) {
      for (let i = 0; i < group.length; i++) {
        const theme = group[i];
        if (i === 0 && separatedThemes.length) {
          const arduinoThemeType = arduinoThemeTypeOf(theme);
          separatedThemes.push(`separator-${arduinoThemeType}`);
        }
        separatedThemes.push(theme);
      }
    }
    return separatedThemes;
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
              SOCKS5
            </label>
          </form>
          <div className="flex-line proxy-settings">
            <div className="column">
              <div className="flex-line">{`${nls.localize(
                'arduino/preferences/proxySettings/hostname',
                'Host name'
              )}:`}</div>
              <div className="flex-line">{`${nls.localize(
                'arduino/preferences/proxySettings/port',
                'Port number'
              )}:`}</div>
              <div className="flex-line">{`${nls.localize(
                'arduino/preferences/proxySettings/username',
                'Username'
              )}:`}</div>
              <div className="flex-line">{`${nls.localize(
                'arduino/preferences/proxySettings/password',
                'Password'
              )}:`}</div>
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

  protected noopKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (this.isControlKey(event)) {
      return;
    }
    event.nativeEvent.preventDefault();
    event.nativeEvent.returnValue = false;
  };

  protected numbersOnlyKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
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

  protected browseSketchbookDidClick = async (): Promise<void> => {
    const uri = await this.props.fileDialogService.showOpenDialog({
      title: nls.localize(
        'arduino/preferences/newSketchbookLocation',
        'Select new sketchbook location'
      ),
      openLabel: nls.localize('arduino/preferences/choose', 'Choose'),
      canSelectFiles: false,
      canSelectMany: false,
      canSelectFolders: true,
      modal: true,
    });
    if (uri) {
      const sketchbookPath = await this.props.fileService.fsPath(uri);
      this.setState({ sketchbookPath });
    }
  };

  protected editAdditionalUrlDidClick = async (): Promise<void> => {
    const additionalUrls = await new AdditionalUrlsDialog(
      AdditionalUrls.parse(this.state.rawAdditionalUrlsValue, ','),
      this.props.windowService
    ).open();
    if (additionalUrls) {
      this.setState({
        rawAdditionalUrlsValue: AdditionalUrls.stringify(additionalUrls),
      });
    }
  };

  private setFontSize = (editorFontSize: number) => {
    this.setState({ editorFontSize });
  };

  protected fontFamilyDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    // Store as a font stack format for compatibility
    const fontFamily = `'${event.target.value}', monospace`;
    this.setState({ editorFontFamily: fontFamily });
  };

  protected rawAdditionalUrlsValueDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({
      rawAdditionalUrlsValue: event.target.value,
    });
  };

  protected autoScaleInterfaceDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ autoScaleInterface: event.target.checked });
  };

  private setInterfaceScale = (percentage: number) => {
    const interfaceScale = InterfaceScale.ZoomLevel.fromPercentage(percentage);
    this.setState({ interfaceScale });
  };

  protected verifyAfterUploadDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ verifyAfterUpload: event.target.checked });
  };

  protected sketchbookShowAllFilesDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ sketchbookShowAllFiles: event.target.checked });
  };

  protected autoSaveDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({
      autoSave: event.target.checked ? Settings.AutoSave.DEFAULT_ON : 'off',
    });
  };

  protected quickSuggestionsOtherDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
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

  protected themeDidChange = (
    event: React.ChangeEvent<HTMLSelectElement> | { target: { value: string } }
  ): void => {
    // Radix select does not provide a native HTMLSelectElement with options.
    // We support both native selects (where selectedIndex is available) and
    // the synthetic callsite used above which passes { target: { value: themeId } }.
    try {
      let theme: Theme | undefined;

      // If the event has native options (native <select>) use the selectedIndex
      // to pick the theme from the separatedThemes array (which includes separators).
      // Otherwise, treat event.target.value as the theme id.
      const anyTarget: any = (event as any).target;
      if (anyTarget && anyTarget.options && typeof anyTarget.options.selectedIndex === 'number') {
        const selectedIndex: number = anyTarget.options.selectedIndex;
        const candidate = this.separatedThemes[selectedIndex];
        if (candidate && typeof candidate !== 'string') {
          theme = candidate;
        }
      } else if (anyTarget && typeof anyTarget.value === 'string') {
        const value: string = anyTarget.value;
        // Try find by id first, then by label for safety
        const candidate = this.separatedThemes
          .filter((item): item is Theme => typeof item !== 'string')
          .find((t) => t.id === value || themeLabelForSettings(t) === value);
        if (candidate) {
          theme = candidate;
        }
      }

      if (theme) {
        this.setState({ themeId: theme.id });
        if (this.props.themeService.getCurrentTheme().id !== theme.id) {
          this.props.themeService.setCurrentTheme(theme.id);
        }
      }
    } catch (e) {
      // swallow any unexpected errors to avoid breaking the dialog
      console.warn('Failed to change theme from settings dialog', e);
    }
  };

  protected languageDidChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const selectedLanguage = event.target.value;
    this.setState({ currentLanguage: selectedLanguage });
  };

  protected compilerWarningsDidChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { selectedIndex } = event.target.options;
    const compilerWarnings = CompilerWarningLiterals[selectedIndex];
    if (compilerWarnings) {
      this.setState({ compilerWarnings });
    }
  };

  protected verboseOnCompileDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ verboseOnCompile: event.target.checked });
  };

  protected verboseOnUploadDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    this.setState({ verboseOnUpload: event.target.checked });
  };

  protected sketchpathDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const sketchbookPath = event.target.value;
    if (sketchbookPath) {
      this.setState({ sketchbookPath });
    }
  };

  protected noProxyDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (event.target.checked) {
      this.setState({ network: 'none' });
    } else {
      this.setState({ network: Network.Default() });
    }
  };

  protected manualProxyDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (event.target.checked) {
      this.setState({ network: Network.Default() });
    } else {
      this.setState({ network: 'none' });
    }
  };

  protected httpProtocolDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.protocol = event.target.checked ? 'http' : 'socks5';
      this.setState({ network });
    }
  };

  protected socksProtocolDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.protocol = event.target.checked ? 'socks5' : 'http';
      this.setState({ network });
    }
  };

  protected hostnameDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.hostname = event.target.value;
      this.setState({ network });
    }
  };

  protected portDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.port = event.target.value;
      this.setState({ network });
    }
  };

  protected usernameDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (this.state.network !== 'none') {
      const network = this.cloneProxySettings;
      network.username = event.target.value;
      this.setState({ network });
    }
  };

  protected passwordDidChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
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
    readonly themeService: ThemeService;
  }
  export type State = Settings & {
    rawAdditionalUrlsValue: string;
  };
  export namespace State {
    export function fromSettings(settings: Settings): State {
      return {
        ...settings,
        rawAdditionalUrlsValue: AdditionalUrls.stringify(
          settings.additionalUrls
        ),
      };
    }
    export function toSettings(state: State): Settings {
      const parsedAdditionalUrls = AdditionalUrls.parse(
        state.rawAdditionalUrlsValue,
        ','
      );
      return {
        ...state,
        additionalUrls: AdditionalUrls.sameAs(
          state.additionalUrls,
          parsedAdditionalUrls
        )
          ? state.additionalUrls
          : parsedAdditionalUrls,
      };
    }
    export function merge(prevState: State, settings: Settings): State {
      const prevAdditionalUrls = AdditionalUrls.parse(
        prevState.rawAdditionalUrlsValue,
        ','
      );
      return {
        ...settings,
        rawAdditionalUrlsValue: prevState.rawAdditionalUrlsValue,
        additionalUrls: AdditionalUrls.sameAs(
          prevAdditionalUrls,
          settings.additionalUrls
        )
          ? prevAdditionalUrls
          : settings.additionalUrls,
      };
    }
  }
}
