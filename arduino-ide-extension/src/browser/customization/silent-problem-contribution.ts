import { injectable } from 'inversify';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { ProblemStat } from '@theia/markers/lib/browser/problem/problem-manager';

@injectable()
export class SilentProblemContribution extends ProblemContribution {

    async initializeLayout(): Promise<void> {
        // await this.openView();
    }

    protected setStatusBarElement(problemStat: ProblemStat) {
        
    }
}
