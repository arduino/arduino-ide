import { injectable } from '@theia/core/shared/inversify';
import {
  ExpressionItem,
  DebugVariable,
} from '@theia/debug/lib/browser/console/debug-console-items';
import { DebugHoverSource as TheiaDebugHoverSource } from '@theia/debug/lib/browser/editor/debug-hover-source';

// TODO: remove after https://github.com/eclipse-theia/theia/pull/9256/.
@injectable()
export class DebugHoverSource extends TheiaDebugHoverSource {
  async evaluate2(
    expression: string
  ): Promise<ExpressionItem | DebugVariable | undefined> {
    const evaluated = await this.doEvaluate(expression);
    const elements = evaluated && (await evaluated.getElements());
    this._expression = evaluated;
    this.elements = elements ? [...elements] : [];
    this.fireDidChange();
    return evaluated;
  }
}
