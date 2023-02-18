import { MenuPath } from '@theia/core';
import { TAB_BAR_TOOLBAR_CONTEXT_MENU } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { DebugToolBar } from '@theia/debug/lib/browser/view/debug-toolbar-widget';
import { DebugVariablesWidget } from '@theia/debug/lib/browser/view/debug-variables-widget';
import {
  ArgumentAdapter,
  PluginMenuCommandAdapter as TheiaPluginMenuCommandAdapter,
} from '@theia/plugin-ext/lib/main/browser/menus/plugin-menu-command-adapter';
import {
  codeToTheiaMappings,
  ContributionPoint,
} from '@theia/plugin-ext/lib/main/browser/menus/vscode-theia-menu-mappings';

function patch(
  toPatch: typeof codeToTheiaMappings,
  key: string,
  value: MenuPath[]
): void {
  const loose = toPatch as Map<string, MenuPath[]>;
  if (!loose.has(key)) {
    loose.set(key, value);
  }
}
// mappings is a const and cannot be customized with DI
patch(codeToTheiaMappings, 'debug/variables/context', [
  DebugVariablesWidget.CONTEXT_MENU,
]);
patch(codeToTheiaMappings, 'debug/toolBar', [DebugToolBar.MENU]);

@injectable()
export class PluginMenuCommandAdapter extends TheiaPluginMenuCommandAdapter {
  @postConstruct()
  protected override init(): void {
    const toCommentArgs: ArgumentAdapter = (...args) =>
      this.toCommentArgs(...args);
    const firstArgOnly: ArgumentAdapter = (...args) => [args[0]];
    const noArgs: ArgumentAdapter = () => [];
    const toScmArgs: ArgumentAdapter = (...args) => this.toScmArgs(...args);
    const selectedResource = () => this.getSelectedResources();
    const widgetURI: ArgumentAdapter = (widget) =>
      this.codeEditorUtil.is(widget)
        ? [this.codeEditorUtil.getResourceUri(widget)]
        : [];
    (<Array<[ContributionPoint, ArgumentAdapter | undefined]>>[
      ['comments/comment/context', toCommentArgs],
      ['comments/comment/title', toCommentArgs],
      ['comments/commentThread/context', toCommentArgs],
      ['debug/callstack/context', firstArgOnly],
      ['debug/variables/context', firstArgOnly],
      ['debug/toolBar', noArgs],
      ['editor/context', selectedResource],
      ['editor/title', widgetURI],
      ['editor/title/context', selectedResource],
      ['explorer/context', selectedResource],
      ['scm/resourceFolder/context', toScmArgs],
      ['scm/resourceGroup/context', toScmArgs],
      ['scm/resourceState/context', toScmArgs],
      ['scm/title', () => this.toScmArg(this.scmService.selectedRepository)],
      ['timeline/item/context', (...args) => this.toTimelineArgs(...args)],
      ['view/item/context', (...args) => this.toTreeArgs(...args)],
      ['view/title', noArgs],
    ]).forEach(([contributionPoint, adapter]) => {
      if (adapter) {
        const paths = codeToTheiaMappings.get(contributionPoint);
        if (paths) {
          paths.forEach((path) => this.addArgumentAdapter(path, adapter));
        }
      }
    });
    this.addArgumentAdapter(TAB_BAR_TOOLBAR_CONTEXT_MENU, widgetURI);
  }
}
