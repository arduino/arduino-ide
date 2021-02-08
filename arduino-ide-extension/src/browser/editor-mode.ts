import { injectable, inject } from 'inversify';
import { FrontendApplicationContribution, FrontendApplication } from '@theia/core/lib/browser';
import { MainMenuManager } from '../common/main-menu-manager';

@injectable()
export class EditorMode implements FrontendApplicationContribution {

    @inject(MainMenuManager)
    protected readonly mainMenuManager: MainMenuManager;

    protected app: FrontendApplication;

    onStart(app: FrontendApplication): void {
        this.app = app;
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
    export const COMPILE_FOR_DEBUG_KEY = 'arduino-compile-for-debug';
}
