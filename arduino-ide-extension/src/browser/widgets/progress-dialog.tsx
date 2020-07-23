import { AbstractDialog } from '@theia/core/lib/browser';

export class InstallationProgressDialog extends AbstractDialog<undefined> {

    readonly value = undefined;

    constructor(componentName: string, version: string) {
        super({ title: 'Installation in progress' });
        this.contentNode.textContent = `Installing ${componentName} [${version}]. Please wait...`;
    }

}

export class UninstallationProgressDialog extends AbstractDialog<undefined> {

    readonly value = undefined;

    constructor(componentName: string) {
        super({ title: 'Uninstallation in progress' });
        this.contentNode.textContent = `Uninstalling ${componentName}. Please wait...`;
    }

}
