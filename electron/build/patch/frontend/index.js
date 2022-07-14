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

const lightTheme = 'arduino-theme';
const darkTheme = 'arduino-theme-dark';
const defaultTheme =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? darkTheme
    : lightTheme;

const arduinoDarkTheme = {
  id: 'arduino-theme-dark',
  type: 'dark',
  label: 'Dark (Arduino)',
  editorTheme: 'arduino-theme-dark',
  activate() { },
  deactivate() { }
};

const arduinoLightTheme = {
  id: 'arduino-theme',
  type: 'light',
  label: 'Light (Arduino)',
  editorTheme: 'arduino-theme',
  activate() { },
  deactivate() { }
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
  themeService.register(...BuiltinThemeProvider.themes, arduinoDarkTheme, arduinoLightTheme);
  themeService.startupTheme();
  themeService.setCurrentTheme(defaultTheme);
  window[ThemeServiceSymbol] = themeService;
}

// Require the original, generated `index.js` for `webpack` as the next entry for the `bundle.js`.
require('../../src-gen/frontend/index');
