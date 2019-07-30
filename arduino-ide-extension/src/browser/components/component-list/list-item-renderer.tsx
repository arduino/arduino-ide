import * as React from 'react';
import { inject, injectable } from 'inversify';
import { WindowService } from '@theia/core/lib/browser/window/window-service';

@injectable()
export abstract class ListItemRenderer<T> {

    @inject(WindowService)
    protected windowService: WindowService;

    protected onClick = (event: React.SyntheticEvent<HTMLAnchorElement, Event>) => {
        const { target } = event.nativeEvent;
        if (target instanceof HTMLAnchorElement) {
            this.windowService.openNewWindow(target.href);
            event.nativeEvent.preventDefault();
        }
    }

    abstract renderItem(item: T, install: (item: T) => Promise<void>): React.ReactNode;

}