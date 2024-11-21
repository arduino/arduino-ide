import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { VsCodePluginScanner as TheiaVsCodePluginScanner } from '@theia/plugin-ext-vscode/lib/node/scanner-vscode';
import {
  PluginPackageViewWelcome,
  ViewWelcome,
} from '@theia/plugin-ext/lib/common/plugin-protocol';

@injectable()
export class VsCodePluginScanner extends TheiaVsCodePluginScanner {
  @postConstruct()
  protected init(): void {
    this['readViewWelcome'] = (
      rawViewWelcome: PluginPackageViewWelcome,
      pluginViewsIds: string[]
    ) => {
      const result = {
        view: rawViewWelcome.view,
        content: rawViewWelcome.contents,
        when: rawViewWelcome.when,
        // if the plugin contributes Welcome view to its own view - it will be ordered first
        order:
          pluginViewsIds.findIndex((v) => v === rawViewWelcome.view) > -1
            ? 0
            : 1,
      };
      return maybeSetEnablement(rawViewWelcome, result);
    };
  }
}

// This is not yet supported by Theia but available in Code (https://github.com/microsoft/vscode/issues/114304)
function maybeSetEnablement(
  rawViewWelcome: PluginPackageViewWelcome,
  result: ViewWelcome
) {
  const enablement =
    'enablement' in rawViewWelcome &&
    typeof rawViewWelcome['enablement'] === 'string' &&
    rawViewWelcome['enablement'];
  if (enablement) {
    Object.assign(result, { enablement });
  }
  return result;
}
