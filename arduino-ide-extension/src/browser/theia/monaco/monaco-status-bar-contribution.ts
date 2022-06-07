import { injectable } from '@theia/core/shared/inversify';
import { MonacoStatusBarContribution as TheiaMonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';

@injectable()
export class MonacoStatusBarContribution extends TheiaMonacoStatusBarContribution {
  protected override setConfigTabSizeWidget() {}

  protected override setLineEndingWidget() {}
}
