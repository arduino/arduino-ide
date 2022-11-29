import { ThemeService as TheiaThemeService } from '@theia/core/lib/browser/theming';
import type { Theme } from '@theia/core/lib/common/theme';
import { injectable } from '@theia/core/shared/inversify';

export namespace ArduinoThemes {
  export const Light: Theme = {
    id: 'arduino-theme',
    type: 'light',
    label: 'Light (Arduino)',
    editorTheme: 'arduino-theme',
  };
  export const Dark: Theme = {
    id: 'arduino-theme-dark',
    type: 'dark',
    label: 'Dark (Arduino)',
    editorTheme: 'arduino-theme-dark',
  };
}

@injectable()
export class ThemeService extends TheiaThemeService {
  protected override init(): void {
    this.register(ArduinoThemes.Light, ArduinoThemes.Dark);
    super.init();
  }
}
