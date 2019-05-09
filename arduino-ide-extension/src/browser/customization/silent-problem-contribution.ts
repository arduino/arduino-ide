import { injectable } from 'inversify';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';

@injectable()
export class SilentProblemContribution extends ProblemContribution {

    async initializeLayout(): Promise<void> {
        // await this.openView();
    }

}
