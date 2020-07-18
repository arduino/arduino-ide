import { injectable } from 'inversify';
import { MonacoStatusBarContribution as TheiaMonacoStatusBarContribution } from '@theia/monaco/lib/browser/monaco-status-bar-contribution';

@injectable()
export class MonacoStatusBarContribution extends TheiaMonacoStatusBarContribution {

    protected setConfigTabSizeWidget() {
    }

    protected setLineEndingWidget() {
    }

}
