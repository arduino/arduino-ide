// Patch for the startup theme. Customizes the `ThemeService.get().defaultTheme();` to dispatch the default IDE2 theme based on the OS' theme.
// For all subsequent starts of the IDE the theme applied will be the last one set by the user.

// With the current version of Theia adopted (1.25) it is not possible to extend the `ThemeService`, it will be possible starting from Theia 1.27.
// Once the version of Theia is updated, this patch will be removed and this functionality will be implemented via dependency injection.
// Ideally, we should open a PR in Theia and add support for `light` and `dark` default themes in the app config.

const {
  ThemeService,
  ThemeServiceSymbol,
  BuiltinThemeProvider,
} = require('@theia/core/lib/browser/theming');
const {
  ApplicationProps,
} = require('@theia/application-package/lib/application-props');
const {
  FrontendApplicationConfigProvider,
} = require('@theia/core/lib/browser/frontend-application-config-provider');

// It is a mighty hack to support theme updates in the bundled IDE2.
// If the custom theme registration happens before the restoration of the existing monaco themes, then any custom theme changes will be ignored.
// This patch introduces a static deferred promise in the monaco-theming service that will be resolved when the restoration is ready.
// IDE2 cannot require the monaco theme service on the outer module level, as it requires the application config provider to be initialized,
// but the initialization happens only in the generated `index.js`.
// This patch customizes the monaco theme service behavior before loading the DI containers via the preload.
// The preload is called only once before the app loads. The Theia extensions are not loaded at that point, but the app config provider is ready.
const preloader = require('@theia/core/lib/browser/preloader');
const originalPreload = preloader.preload;
preloader.preload = async function () {
  const { MonacoThemingService } = require('@theia/monaco/lib/browser/monaco-theming-service');
  const { MonacoThemeServiceIsReady } = require('arduino-ide-extension/lib/browser/utils/window');
  const { Deferred } = require('@theia/core/lib/common/promise-util');
  const ready = new Deferred();
  if (!window[MonacoThemeServiceIsReady]) {
    window[MonacoThemeServiceIsReady] = ready;
    console.log('Registered a custom monaco-theme service initialization signal on the window object.');
  }
  // Here, it is safe to patch the theme service, app config provider is ready.
  MonacoThemingService.init = async function () {
    this.updateBodyUiTheme();
    ThemeService.get().onDidColorThemeChange(() => this.updateBodyUiTheme());
    await this.restore();
    ready.resolve();
  }.bind(MonacoThemingService);
  return originalPreload();
}.bind(preloader);

const lightTheme = 'arduino-theme';
const darkTheme = 'arduino-theme-dark';
const defaultTheme =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? darkTheme
    : lightTheme;

const originalGet = FrontendApplicationConfigProvider.get;
FrontendApplicationConfigProvider.get = function () {
  const originalProps = originalGet.bind(FrontendApplicationConfigProvider)();
  return { ...originalProps, defaultTheme };
}.bind(FrontendApplicationConfigProvider);

const arduinoDarkTheme = {
  id: 'arduino-theme-dark',
  type: 'dark',
  label: 'Dark (Arduino)',
  editorTheme: 'arduino-theme-dark',
  activate() {},
  deactivate() {},
};

const arduinoLightTheme = {
  id: 'arduino-theme',
  type: 'light',
  label: 'Light (Arduino)',
  editorTheme: 'arduino-theme',
  activate() {},
  deactivate() {},
};

if (!window[ThemeServiceSymbol]) {
  const themeService = new ThemeService();
  Object.defineProperty(themeService, 'defaultTheme', {
    get: function () {
      return (
        this.themes[defaultTheme] ||
        this.themes[ApplicationProps.DEFAULT.frontend.config.defaultTheme]
      );
    },
  });
  themeService.register(
    ...BuiltinThemeProvider.themes,
    arduinoDarkTheme,
    arduinoLightTheme
  );
  themeService.startupTheme();
  themeService.setCurrentTheme(defaultTheme);
  window[ThemeServiceSymbol] = themeService;
}

// Require the original, generated `index.js` for `webpack` as the next entry for the `bundle.js`.
require('../../src-gen/frontend/index');
