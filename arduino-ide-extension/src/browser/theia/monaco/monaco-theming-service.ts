import { injectable } from '@theia/core/shared/inversify';
import { MonacoThemingService as TheiaMonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';

@injectable()
export class MonacoThemingService extends TheiaMonacoThemingService {
  override initialize(): void {
    super.initialize();
    this.registerParsedTheme({
      id: 'arduino-theme',
      label: 'Light (Arduino)',
      uiTheme: 'vs',
      json: require('../../../../src/browser/data/default.color-theme.json'),
    });
    this.registerParsedTheme({
      id: 'arduino-theme-dark',
      label: 'Dark (Arduino)',
      uiTheme: 'vs-dark',
      json: require('../../../../src/browser/data/dark.color-theme.json'),
    });
  }
}
