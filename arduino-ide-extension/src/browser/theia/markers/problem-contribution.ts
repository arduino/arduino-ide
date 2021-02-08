import { injectable } from 'inversify';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { ProblemStat } from '@theia/markers/lib/browser/problem/problem-manager';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { ProblemContribution as TheiaProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';

@injectable()
export class ProblemContribution extends TheiaProblemContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // NOOP
    }

    protected setStatusBarElement(problemStat: ProblemStat): void {
        // NOOP
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        if (this.toggleCommand) {
            keybindings.registerKeybinding({
                command: this.toggleCommand.id,
                keybinding: 'ctrlcmd+alt+shift+m'
            });
        }
    }

}
