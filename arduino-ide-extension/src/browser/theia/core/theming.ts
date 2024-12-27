import {
  BuiltinThemeProvider,
  ThemeService,
} from '@theia/core/lib/browser/theming';
import { nls } from '@theia/core/lib/common/nls';
import type { Theme, ThemeType } from '@theia/core/lib/common/theme';
import { assertUnreachable } from '../../../common/utils';

export namespace ArduinoThemes {
  export const light: Theme = {
    id: 'arduino-theme',
    type: 'light',
    label: 'Light (LingZhi)',
    editorTheme: 'arduino-theme',
  };
  export const dark: Theme = {
    id: 'arduino-theme-dark',
    type: 'dark',
    label: 'Dark (LingZhi)',
    editorTheme: 'arduino-theme-dark',
  };
}

const builtInThemeIds = new Set(
  [
    ArduinoThemes.light,
    ArduinoThemes.dark,
    BuiltinThemeProvider.hcLightTheme,
    BuiltinThemeProvider.hcTheme,
  ].map(({ id }) => id)
);
const deprecatedThemeIds = new Set(
  [BuiltinThemeProvider.lightTheme, BuiltinThemeProvider.darkTheme].map(
    ({ id }) => id
  )
);

export const lightThemeLabel = nls.localize('arduino/theme/light', 'Light');
export const darkThemeLabel = nls.localize('arduino/theme/dark', 'Dark');
export const hcLightThemeLabel = nls.localize(
  'arduino/theme/hcLight',
  'Light High Contrast'
);
export const hcThemeLabel = nls.localize(
  'arduino/theme/hc',
  'Dark High Contrast'
);
export function userThemeLabel(theme: Theme): string {
  return nls.localize('arduino/theme/user', '{0} (user)', theme.label);
}
export function deprecatedThemeLabel(theme: Theme): string {
  return nls.localize(
    'arduino/theme/deprecated',
    '{0} (deprecated)',
    theme.label
  );
}

export function themeLabelForSettings(theme: Theme): string {
  switch (theme.id) {
    case ArduinoThemes.light.id:
      return lightThemeLabel;
    case ArduinoThemes.dark.id:
      return darkThemeLabel;
    case BuiltinThemeProvider.hcTheme.id:
      return hcThemeLabel;
    case BuiltinThemeProvider.hcLightTheme.id:
      return hcLightThemeLabel;
    case BuiltinThemeProvider.lightTheme.id: // fall-through
    case BuiltinThemeProvider.darkTheme.id:
      return deprecatedThemeLabel(theme);
    default:
      return userThemeLabel(theme);
  }
}

export function compatibleBuiltInTheme(theme: Theme): Theme {
  switch (theme.type) {
    case 'light':
      return ArduinoThemes.light;
    case 'dark':
      return ArduinoThemes.dark;
    case 'hc':
      return BuiltinThemeProvider.hcTheme;
    case 'hcLight':
      return BuiltinThemeProvider.hcLightTheme;
    default: {
      console.warn(
        `Unhandled theme type: ${theme.type}. Theme ID: ${theme.id}, label: ${theme.label}`
      );
      return ArduinoThemes.light;
    }
  }
}

// For tests without DI
interface ThemeProvider {
  themes(): Theme[];
  currentTheme(): Theme;
}

/**
 * Returns with a list of built-in themes officially supported by IDE2 (https://github.com/arduino/arduino-ide/issues/1283).
 * The themes in the array follow the following order:
 *  - built-in themes first (in `Light`, `Dark`, `Light High Contrast`, and `Dark High Contrast`),
 *  - followed by user installed (VSIX) themes grouped by theme type, then alphabetical order,
 *  - if the `currentTheme` is either Light (Theia) or Dark (Theia), the last item of the array will be the selected theme with `(deprecated)` suffix.
 */
export function userConfigurableThemes(service: ThemeService): Theme[][];
export function userConfigurableThemes(provider: ThemeProvider): Theme[][];
export function userConfigurableThemes(
  serviceOrProvider: ThemeService | ThemeProvider
): Theme[][] {
  const provider =
    serviceOrProvider instanceof ThemeService
      ? {
        currentTheme: () => serviceOrProvider.getCurrentTheme(),
        themes: () => serviceOrProvider.getThemes(),
      }
      : serviceOrProvider;
  const currentTheme = provider.currentTheme();
  const allThemes = provider
    .themes()
    .map((theme) => ({ ...theme, arduinoThemeType: arduinoThemeTypeOf(theme) }))
    .filter(
      (theme) =>
        theme.arduinoThemeType !== 'deprecated' || currentTheme.id === theme.id
    )
    .sort((left, right) => {
      const leftArduinoThemeType = left.arduinoThemeType;
      const rightArduinoThemeType = right.arduinoThemeType;
      if (leftArduinoThemeType === rightArduinoThemeType) {
        const result = themeTypeOrder[left.type] - themeTypeOrder[right.type];
        if (result) {
          return result;
        }
        return left.label.localeCompare(right.label); // alphabetical order
      }
      return (
        arduinoThemeTypeOrder[leftArduinoThemeType] -
        arduinoThemeTypeOrder[rightArduinoThemeType]
      );
    });
  const builtInThemes: Theme[] = [];
  const userThemes: Theme[] = [];
  const deprecatedThemes: Theme[] = [];
  allThemes.forEach((theme) => {
    const { arduinoThemeType } = theme;
    switch (arduinoThemeType) {
      case 'built-in':
        builtInThemes.push(theme);
        break;
      case 'user':
        userThemes.push(theme);
        break;
      case 'deprecated':
        deprecatedThemes.push(theme);
        break;
      default:
        assertUnreachable(arduinoThemeType);
    }
  });
  const groupedThemes: Theme[][] = [];
  if (builtInThemes.length) {
    groupedThemes.push(builtInThemes);
  }
  // if (userThemes.length) {
  //   groupedThemes.push(userThemes);
  // }
  // if (deprecatedThemes.length) {
  //   groupedThemes.push(deprecatedThemes);
  // }
  return groupedThemes;
}

export type ArduinoThemeType = 'built-in' | 'user' | 'deprecated';
const arduinoThemeTypeOrder: Record<ArduinoThemeType, number> = {
  'built-in': 0,
  user: 1,
  deprecated: 2,
};
const themeTypeOrder: Record<ThemeType, number> = {
  light: 0,
  dark: 1,
  hcLight: 2,
  hc: 3,
};

export function arduinoThemeTypeOf(theme: Theme | string): ArduinoThemeType {
  const themeId = typeof theme === 'string' ? theme : theme.id;
  if (builtInThemeIds.has(themeId)) {
    return 'built-in';
  }
  if (deprecatedThemeIds.has(themeId)) {
    return 'deprecated';
  }
  return 'user';
}
