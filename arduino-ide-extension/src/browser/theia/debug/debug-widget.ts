import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { DebugWidget as TheiaDebugWidget } from '@theia/debug/lib/browser/view/debug-widget';
import { DebugDisabledStatusMessageSource } from '../../contributions/debug';
import {
  removeWidgetIfPresent,
  unshiftWidgetIfNotPresent,
} from '../dialogs/widgets';

@injectable()
export class DebugWidget extends TheiaDebugWidget {
  @inject(DebugDisabledStatusMessageSource)
  private readonly debugStatusMessageSource: DebugDisabledStatusMessageSource;

  private readonly statusMessageWidget = new Widget();
  private readonly messageNode = document.createElement('div');

  @postConstruct()
  protected override init(): void {
    super.init();
    this.messageNode.classList.add('status-message', 'noselect');
    this.statusMessageWidget.node.appendChild(this.messageNode);
    this.updateState();
    this.toDisposeOnDetach.pushAll([
      this.debugStatusMessageSource.onDidChangeMessage((message) =>
        this.updateState(message)
      ),
      this.statusMessageWidget,
    ]);
  }

  private updateState(message = this.debugStatusMessageSource.message): void {
    requestAnimationFrame(() => {
      this.messageNode.textContent = message ?? '';
      const enabled = !message;
      updateVisibility(enabled, this.toolbar, this.sessionWidget);
      if (enabled) {
        removeWidgetIfPresent(this.layout, this.statusMessageWidget);
      } else {
        unshiftWidgetIfNotPresent(this.layout, this.statusMessageWidget);
      }
      this.title.iconClass = enabled ? codicon('debug-alt') : 'fa fa-ban'; // TODO: find a better icon?
    });
  }
}

function updateVisibility(visible: boolean, ...widgets: Widget[]): void {
  widgets.forEach((widget) =>
    visible ? widget.removeClass('hidden') : widget.addClass('hidden')
  );
}
