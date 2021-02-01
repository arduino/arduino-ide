import { injectable } from 'inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ListWidget } from './list-widget';

@injectable()
export abstract class ListWidgetFrontendContribution<T extends ArduinoComponent> extends AbstractViewContribution<ListWidget<T>> implements FrontendApplicationContribution {

    async initializeLayout(): Promise<void> {
    }

    registerMenus(): void {
        // NOOP
    }

}
