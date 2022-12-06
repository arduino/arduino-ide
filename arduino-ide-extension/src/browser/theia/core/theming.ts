import type { Theme } from '@theia/core/lib/common/theme';
import { injectable } from '@theia/core/shared/inversify';
import { ThemeServiceWithDB as TheiaThemeServiceWithDB } from '@theia/monaco/lib/browser/monaco-indexed-db';

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
export class ThemeServiceWithDB extends TheiaThemeServiceWithDB {
  protected override init(): void {
    this.register(ArduinoThemes.Light, ArduinoThemes.Dark);
    super.init();
  }
}
