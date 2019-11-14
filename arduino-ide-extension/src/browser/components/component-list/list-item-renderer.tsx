import * as React from 'react';
import { inject, injectable } from 'inversify';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { Installable } from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ComponentListItem } from './component-list-item';

@injectable()
export abstract class ListItemRenderer<T extends ArduinoComponent> {

    @inject(WindowService)
    protected windowService: WindowService;

    protected onMoreInfoClick = (event: React.SyntheticEvent<HTMLAnchorElement, Event>) => {
        const { target } = event.nativeEvent;
        if (target instanceof HTMLAnchorElement) {
            this.windowService.openNewWindow(target.href, { external: true });
            event.nativeEvent.preventDefault();
        }
    }

    abstract renderItem(
        input: ComponentListItem.State & { item: T },
        install: (item: T) => Promise<void>,
        onVersionChange: (version: Installable.Version) => void
    ): React.ReactNode;

}