import { ApplicationProps } from '@theia/application-package/lib/application-props';
import { ThemeService as TheiaThemeService } from '@theia/core/lib/browser/theming';
import type { Theme } from '@theia/core/lib/common/theme';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class ThemeService extends TheiaThemeService {
  override get defaultTheme(): Theme {
    // TODO: provide a PR in Theia to support `light` and `dark` themes natively.
    return (
      this.themes[ArduinoThemes.Default.id] ||
      this.themes[ApplicationProps.DEFAULT.frontend.config.defaultTheme]
    );
  }
}

export namespace ArduinoThemes {
  export const Light: Theme = {
    id: 'arduino-theme',
    type: 'light',
    label: 'Light (Arduino)',
    editorTheme: 'arduino-theme',
  };
  export const Dark: Theme = {
    id: 'arduino-dark-theme',
    type: 'dark',
    label: 'Dark (Arduino)',
    editorTheme: 'arduino-dark-theme',
  };
  export const Default =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? Dark
      : Light;
}
