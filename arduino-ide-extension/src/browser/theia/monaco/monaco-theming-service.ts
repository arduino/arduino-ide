import { injectable } from '@theia/core/shared/inversify';
import { MonacoThemingService as TheiaMonacoThemingService } from '@theia/monaco/lib/browser/monaco-theming-service';
import { ArduinoThemes } from '../core/theming';

@injectable()
export class MonacoThemingService extends TheiaMonacoThemingService {
  override initialize(): void {
    super.initialize();
    const { Light, Dark } = ArduinoThemes;
    this.registerParsedTheme({
      id: Light.id,
      label: Light.label,
      uiTheme: 'vs',
      json: require('../../../../src/browser/data/default.color-theme.json'),
    });
    this.registerParsedTheme({
      id: Dark.id,
      label: Dark.label,
      uiTheme: 'vs-dark',
      json: require('../../../../src/browser/data/dark.color-theme.json'),
    });
  }
}
