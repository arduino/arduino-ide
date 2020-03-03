import { injectable, inject } from 'inversify';
import { ApplicationShell, FrontendApplicationContribution, FrontendApplication, Widget } from '@theia/core/lib/browser';
import { EditorWidget } from '@theia/editor/lib/browser';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';
import { MainMenuManager } from './menu/main-menu-manager';
import { BoardsListWidget } from './boards/boards-list-widget';
import { LibraryListWidget } from './library/library-list-widget';
import { ArduinoShellLayoutRestorer } from './shell/arduino-shell-layout-restorer';

@injectable()
export class EditorMode implements FrontendApplicationContribution {

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    protected app: FrontendApplication;

    onStart(app: FrontendApplication): void {
        this.app = app;
        if (this.proMode) {
            // We use this CSS class on the body to modify the visibility of the close button for the editors and views.
            document.body.classList.add(EditorMode.PRO_MODE_KEY);
        }
    }

    get proMode(): boolean {
        const value = window.localStorage.getItem(EditorMode.PRO_MODE_KEY);
        return value === 'true';
    }

    async toggleProMode(): Promise<void> {
        const oldState = this.proMode;
        const inAdvancedMode = !oldState;
        window.localStorage.setItem(EditorMode.PRO_MODE_KEY, String(inAdvancedMode));
        if (!inAdvancedMode) {
            const { shell } = this.app;
            // Close all widgets that are neither editor nor `Output` / `Boards Manager` / `Library Manager`.
            for (const area of ['left', 'right', 'bottom', 'main'] as Array<ApplicationShell.Area>) {
                shell.closeTabs(area, title => !this.isInSimpleMode(title.owner));
            }
        }
        // `storeLayout` has a sync API but the implementation is async, we store the layout manually before we reload the page.
        // See: https://github.com/eclipse-theia/theia/issues/6579
        // XXX: hack instead of injecting the `ArduinoShellLayoutRestorer` we have to retrieve it from the application to avoid DI cycle.
        const layoutRestorer = (this.app as any).layoutRestorer as ArduinoShellLayoutRestorer
        await layoutRestorer.storeLayoutAsync(this.app);
        window.location.reload(true);
    }

    protected isInSimpleMode(widget: Widget): boolean {
        return widget instanceof EditorWidget
            || widget instanceof OutputWidget
            || widget instanceof BoardsListWidget
            || widget instanceof LibraryListWidget;
    }

    get compileForDebug(): boolean {
        const value = window.localStorage.getItem(EditorMode.COMPILE_FOR_DEBUG_KEY);
        return value === 'true';
    }

    async toggleCompileForDebug(): Promise<void> {
        const oldState = this.compileForDebug;
        const newState = !oldState;
        window.localStorage.setItem(EditorMode.COMPILE_FOR_DEBUG_KEY, String(newState));
        this.mainMenuManager.update();
    }

}

export namespace EditorMode {
    export const PRO_MODE_KEY = 'arduino-advanced-mode';
    export const COMPILE_FOR_DEBUG_KEY = 'arduino-compile-for-debug';
}
