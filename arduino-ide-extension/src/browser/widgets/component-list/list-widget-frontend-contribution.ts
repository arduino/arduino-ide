import { injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ListWidget } from './list-widget';
import { Searchable } from '../../../common/protocol';

@injectable()
export abstract class ListWidgetFrontendContribution<
    T extends ArduinoComponent,
    S extends Searchable.Options
  >
  extends AbstractViewContribution<ListWidget<T, S>>
  implements FrontendApplicationContribution
{
  async initializeLayout(): Promise<void> {
    // TS requires at least one method from `FrontendApplicationContribution`.
    // Expected to be empty.
  }

  override registerMenus(): void {
    // NOOP
  }
}
