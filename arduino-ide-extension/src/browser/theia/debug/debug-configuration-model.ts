import { Event } from '@theia/core/lib/common/event';
import URI from '@theia/core/lib/common/uri';
import { PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-common';
import { DebugConfigurationModel as TheiaDebugConfigurationModel } from '@theia/debug/lib/browser/debug-configuration-model';

export class DebugConfigurationModel extends TheiaDebugConfigurationModel {

    constructor(
        readonly workspaceFolderUri: string,
        protected readonly preferences: PreferenceService,
        protected readonly config: DebugConfiguration[],
        protected configUri: URI | undefined,
        protected readonly onConfigDidChange: Event<TheiaDebugConfigurationModel.JsonContent>) {

        super(workspaceFolderUri, preferences);
        this.toDispose.push(onConfigDidChange(content => {
            const { uri, configurations } = content;
            this.configUri = uri;
            this.config.length = 0;
            this.config.push(...configurations);
            this.reconcile();
        }));
        this.reconcile();
    }

    protected parseConfigurations(): TheiaDebugConfigurationModel.JsonContent {
        return {
            uri: this.configUri,
            configurations: this.config
        };
    }

}

export namespace DebugConfigurationModel {
    export function parse(launchConfig: any): DebugConfiguration[] {
        const configurations: DebugConfiguration[] = [];
        if (launchConfig && typeof launchConfig === 'object' && 'configurations' in launchConfig) {
            if (Array.isArray(launchConfig.configurations)) {
                for (const configuration of launchConfig.configurations) {
                    if (DebugConfiguration.is(configuration)) {
                        configurations.push(configuration);
                    }
                }
            }
        }
        return configurations;
    }
}
