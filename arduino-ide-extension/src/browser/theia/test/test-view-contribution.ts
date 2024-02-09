import { TestViewContribution as TheiaTestViewContribution } from '@theia/test/lib/browser/view/test-view-contribution';
import { injectable } from 'inversify';

@injectable()
export class TestViewContribution extends TheiaTestViewContribution {
  override async initializeLayout(): Promise<void> {
    // NOOP
  }
}
