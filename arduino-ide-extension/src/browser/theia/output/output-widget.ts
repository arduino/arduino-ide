import { injectable } from 'inversify';
import { Message, Widget } from '@theia/core/lib/browser';
import { OutputWidget as TheiaOutputWidget } from '@theia/output/lib/browser/output-widget';

// Patched after https://github.com/eclipse-theia/theia/issues/8361
// Remove this module after ATL-222 and the Theia update.
@injectable()
export class OutputWidget extends TheiaOutputWidget {

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.onResize(Widget.ResizeMessage.UnknownSize);
    }

}
