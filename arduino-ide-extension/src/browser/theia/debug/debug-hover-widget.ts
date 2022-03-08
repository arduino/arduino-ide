import { injectable, interfaces, Container } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { SourceTreeWidget } from '@theia/core/lib/browser/source-tree';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { DebugEditor } from '@theia/debug/lib/browser/editor/debug-editor';
import { DebugVariable } from '@theia/debug/lib/browser/console/debug-console-items';
import { DebugExpressionProvider } from '@theia/debug/lib/browser/editor/debug-expression-provider';
import { DebugHoverSource as TheiaDebugHoverSource } from '@theia/debug/lib/browser/editor/debug-hover-source';
import {
  DebugHoverWidget as TheiaDebugHoverWidget,
  ShowDebugHoverOptions,
} from '@theia/debug/lib/browser/editor/debug-hover-widget';
import { DebugHoverSource } from './debug-hover-source';

export function createDebugHoverWidgetContainer(
  parent: interfaces.Container,
  editor: DebugEditor
): Container {
  const child = SourceTreeWidget.createContainer(parent, {
    virtualized: false,
  });
  child.bind(DebugEditor).toConstantValue(editor);
  child.bind(TheiaDebugHoverSource).toSelf();
  child.bind(DebugHoverSource).toSelf();
  child.rebind(TheiaDebugHoverSource).to(DebugHoverSource);
  child.unbind(SourceTreeWidget);
  child.bind(DebugExpressionProvider).toSelf();
  child.bind(TheiaDebugHoverWidget).toSelf();
  child.bind(DebugHoverWidget).toSelf();
  child.rebind(TheiaDebugHoverWidget).to(DebugHoverWidget);
  return child;
}

// TODO: remove patch after https://github.com/eclipse-theia/theia/pull/9256/
@injectable()
export class DebugHoverWidget extends TheiaDebugHoverWidget {
  protected async doShow(
    options: ShowDebugHoverOptions | undefined = this.options
  ): Promise<void> {
    if (!this.isEditorFrame()) {
      this.hide();
      return;
    }
    if (!options) {
      this.hide();
      return;
    }
    if (this.options && this.options.selection.equalsRange(options.selection)) {
      return;
    }
    if (!this.isAttached) {
      Widget.attach(this, this.contentNode);
    }

    this.options = options;
    const matchingExpression = this.expressionProvider.get(
      this.editor.getControl().getModel()!,
      options.selection
    );
    if (!matchingExpression) {
      this.hide();
      return;
    }
    const toFocus = new DisposableCollection();
    if (this.options.focus === true) {
      toFocus.push(
        this.model.onNodeRefreshed(() => {
          toFocus.dispose();
          this.activate();
        })
      );
    }
    const expression = await (this.hoverSource as DebugHoverSource).evaluate2(
      matchingExpression
    );
    if (!expression || !expression.value) {
      toFocus.dispose();
      this.hide();
      return;
    }

    this.contentNode.hidden = false;
    ['number', 'boolean', 'string'].forEach((token) =>
      this.titleNode.classList.remove(token)
    );
    this.domNode.classList.remove('complex-value');
    if (expression.hasElements) {
      this.domNode.classList.add('complex-value');
    } else {
      this.contentNode.hidden = true;
      if (
        expression.type === 'number' ||
        expression.type === 'boolean' ||
        expression.type === 'string'
      ) {
        this.titleNode.classList.add(expression.type);
      } else if (!isNaN(+expression.value)) {
        this.titleNode.classList.add('number');
      } else if (DebugVariable.booleanRegex.test(expression.value)) {
        this.titleNode.classList.add('boolean');
      } else if (DebugVariable.stringRegex.test(expression.value)) {
        this.titleNode.classList.add('string');
      }
    }

    // super.show(); // Here we cannot call `super.show()` but have to call `show` on the `Widget` prototype.
    Widget.prototype.show.call(this);
    await new Promise<void>((resolve) => {
      setTimeout(
        () =>
          window.requestAnimationFrame(() => {
            this.editor.getControl().layoutContentWidget(this);
            resolve();
          }),
        0
      );
    });
  }
}
