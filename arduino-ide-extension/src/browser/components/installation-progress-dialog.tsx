import { AbstractDialog } from '@theia/core/lib/browser';

export class InstallationProgressDialog extends AbstractDialog<undefined> {

    readonly value = undefined;

    constructor(componentName: string) {
        super({ title: 'Installation in progress' });
        this.contentNode.textContent = `Installing ${componentName}. Please wait.`;
    }

}
