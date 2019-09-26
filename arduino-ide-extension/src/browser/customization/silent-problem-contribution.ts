import { injectable } from 'inversify';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { ProblemStat } from '@theia/markers/lib/browser/problem/problem-manager';
import { FrontendApplication } from '@theia/core/lib/browser';

@injectable()
export class SilentProblemContribution extends ProblemContribution {

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }

    protected setStatusBarElement(problemStat: ProblemStat) {
    }

}
