import { injectable, inject } from 'inversify';
import { HostedPluginReader as TheiaHostedPluginReader } from '@theia/plugin-ext/lib/hosted/node/plugin-reader';
import { PluginPackage, PluginContribution } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { CLI_CONFIG } from '../../cli-config';
import { ConfigServiceImpl } from '../../config-service-impl';

@injectable()
export class HostedPluginReader extends TheiaHostedPluginReader {

    @inject(ConfigServiceImpl)
    protected readonly configService: ConfigServiceImpl;
    protected cliConfigSchemaUri: string;

    async onStart(): Promise<void> {
        this.cliConfigSchemaUri = await this.configService.getConfigurationFileSchemaUri();
    }

    readContribution(plugin: PluginPackage): PluginContribution | undefined {
        const scanner = this.scanner.getScanner(plugin);
        const contribution = scanner.getContribution(plugin);
        if (!contribution) {
            return contribution;
        }
        if (plugin.name === 'vscode-yaml' && plugin.publisher === 'redhat' && contribution.configuration) {
            // Use the schema for the Arduino CLI.
            const { configuration } = contribution;
            for (const config of configuration) {
                if (typeof config.properties['yaml.schemas'] === 'undefined') {
                    config.properties['yaml.schemas'] = {};
                }
                config.properties['yaml.schemas'].default = {
                    [this.cliConfigSchemaUri]: [CLI_CONFIG]
                };
            }
        } else if (plugin.name === 'cpp' && plugin.publisher === 'vscode' && contribution.languages) {
            // Do not associate `.ino` files with the VS Code built-in extension for C++.
            // https://github.com/eclipse-theia/theia/issues/7533#issuecomment-611055328
            for (const language of contribution.languages) {
                if (language.extensions) {
                    language.extensions = language.extensions.filter(ext => ext !== '.ino');
                }
            }
        }
        return contribution;
    }

}
