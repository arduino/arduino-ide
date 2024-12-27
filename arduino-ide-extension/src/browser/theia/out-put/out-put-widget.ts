/* eslint-disable prettier/prettier */
import { OutputWidget } from '@theia/output/lib/browser/output-widget';

export class MyOutputWidget extends OutputWidget {
    protected override init(): void {
        super.init();
        this.title.label = '输出';
        this.title.caption = '输出';
    }
}
