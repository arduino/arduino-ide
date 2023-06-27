import { injectable } from '@theia/core/shared/inversify';
import { TerminalWidgetImpl as TheiaTerminalWidgetImpl } from '@theia/terminal/lib/browser/terminal-widget-impl';
import debounce from 'p-debounce';

// Patch for https://github.com/eclipse-theia/theia/pull/12587
@injectable()
export class TerminalWidgetImpl extends TheiaTerminalWidgetImpl {
  private readonly debouncedResizeTerminal = debounce(
    () => this.doResizeTerminal(),
    50
  );

  protected override resizeTerminal(): void {
    this.debouncedResizeTerminal();
  }

  private doResizeTerminal(): void {
    const geo = this.fitAddon.proposeDimensions();
    const cols = geo.cols;
    const rows = geo.rows - 1; // subtract one row for margin
    this.term.resize(cols, rows);
  }
}
