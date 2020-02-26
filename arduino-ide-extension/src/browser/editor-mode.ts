import { injectable } from 'inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ApplicationShell, FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { ArduinoShellLayoutRestorer } from './shell/arduino-shell-layout-restorer';
import { OutputWidget } from '@theia/output/lib/browser/output-widget';
import { EditorWidget } from '@theia/editor/lib/browser';

@injectable()
export class EditorMode implements FrontendApplicationContribution {

    readonly menuContentChanged = new Emitter<void>();

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
            // Close all widget that is neither editor nor `Output`.
            for (const area of ['left', 'right', 'bottom', 'main'] as Array<ApplicationShell.Area>) {
                shell.closeTabs(area, ({ owner }) => !(owner instanceof EditorWidget || owner instanceof OutputWidget));
            }
        }
        // `storeLayout` has a sync API but the implementation is async, we store the layout manually before we reload the page.
        // See: https://github.com/eclipse-theia/theia/issues/6579
        // XXX: hack instead of injecting the `ArduinoShellLayoutRestorer` we have to retrieve it from the application to avoid DI cycle.
        const layoutRestorer = (this.app as any).layoutRestorer as ArduinoShellLayoutRestorer
        await layoutRestorer.storeLayoutAsync(this.app);
        window.location.reload(true);
    }

    get compileForDebug(): boolean {
        const value = window.localStorage.getItem(EditorMode.COMPILE_FOR_DEBUG_KEY);
        return value === 'true';
    }

    async toggleCompileForDebug(): Promise<void> {
        const oldState = this.compileForDebug;
        const newState = !oldState;
        window.localStorage.setItem(EditorMode.COMPILE_FOR_DEBUG_KEY, String(newState));
    }

}

export namespace EditorMode {
    export const PRO_MODE_KEY = 'arduino-advanced-mode';
    export const COMPILE_FOR_DEBUG_KEY = 'arduino-compile-for-debug';
}
