import * as electron from 'electron';
import { injectable, inject, postConstruct } from 'inversify';
import { isOSX } from '@theia/core/lib/common/os';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { EditorMode } from '../browser/editor-mode';

@injectable()
export class ElectronArduinoMenuContribution extends ElectronMenuContribution {

    @inject(EditorMode)
    protected readonly editorMode: EditorMode;

    @postConstruct()
    protected init(): void {
        this.editorMode.menuContentChanged.event(() => {
            const createdMenuBar = this.factory.createMenuBar();
            if (isOSX) {
                electron.remote.Menu.setApplicationMenu(createdMenuBar);
            } else {
                electron.remote.getCurrentWindow().setMenu(createdMenuBar);
            }
        });
    }

    protected hideTopPanel(): void {
        // NOOP
        // We reuse the `div` for the Arduino toolbar.
    }

}
