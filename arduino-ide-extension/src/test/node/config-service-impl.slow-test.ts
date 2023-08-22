import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { deepClone } from '@theia/core/lib/common/objects';
import type { MaybePromise, Mutable } from '@theia/core/lib/common/types';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { load as parseYaml } from 'js-yaml';
import { promises as fs } from 'node:fs';
import { Config, Network } from '../../common/protocol/config-service';
import { CLI_CONFIG, DefaultCliConfig } from '../../node/cli-config';
import { ConfigServiceImpl } from '../../node/config-service-impl';
import { ConfigDirUriProvider } from '../../node/theia/env-variables/env-variables-server';
import { createBaseContainer, startDaemon } from './node-test-bindings';

describe('config-service-impl', () => {
  describe('setConfiguration', () => {
    const manualProxy: Network = {
      protocol: 'http',
      hostname: 'hostname',
      password: 'secret',
      username: 'username',
      port: '1234',
    };
    const noProxy: Network = 'none';

    let configService: ConfigServiceImpl;
    let toDispose: DisposableCollection;
    let cliConfigPath: string;

    beforeEach(async () => {
      const container = await createContainer();
      toDispose = new DisposableCollection();
      await startDaemon(container, toDispose);
      configService = container.get<ConfigServiceImpl>(ConfigServiceImpl);
      const configDirUriProvider =
        container.get<ConfigDirUriProvider>(ConfigDirUriProvider);
      cliConfigPath = configDirUriProvider
        .configDirUri()
        .resolve(CLI_CONFIG)
        .path.fsPath();
    });

    afterEach(() => toDispose.dispose());

    it("should detect 'none' proxy with th default config", async () => {
      const state = await configService.getConfiguration();
      expect(state.config).to.be.not.undefined;
      const config = <Config>state.config;
      expect(config.network).to.be.equal(noProxy);
      expect(Network.stringify(config.network)).is.undefined;
      await assertRawConfigModel((actualModel) => {
        expect(actualModel.network).to.be.undefined;
      });
    });

    it('should ignore noop changes', async () => {
      const beforeState = await configService.getConfiguration();
      const config = <Mutable<Config>>deepClone(beforeState).config;
      let eventCounter = 0;
      toDispose.push(configService.onConfigChange(() => eventCounter++));
      await configService.setConfiguration(config);
      const afterState = await configService.getConfiguration();
      expect(beforeState.config).to.be.deep.equal(afterState.config);
      expect(eventCounter).to.be.equal(0);
    });

    it('should set the manual proxy', async () => {
      const beforeState = await configService.getConfiguration();
      const config = <Mutable<Config>>deepClone(beforeState).config;
      config.network = manualProxy;
      let eventCounter = 0;
      toDispose.push(configService.onConfigChange(() => eventCounter++));
      await configService.setConfiguration(config);
      const afterState = await configService.getConfiguration();
      expect(beforeState.config).to.be.not.deep.equal(afterState.config);
      expect(afterState.config?.network).to.be.deep.equal(manualProxy);
      expect(eventCounter).to.be.equal(1);
      await assertRawConfigModel((actualModel) => {
        expect(actualModel.network?.proxy).to.be.equal(
          Network.stringify(manualProxy)
        );
      });
    });

    it('should unset the manual proxy', async () => {
      const initialState = await configService.getConfiguration();
      const config = <Mutable<Config>>deepClone(initialState).config;
      config.network = manualProxy;
      let eventCounter = 0;
      toDispose.push(configService.onConfigChange(() => eventCounter++));
      await configService.setConfiguration(config);
      const beforeState = await configService.getConfiguration();
      const config2 = <Mutable<Config>>deepClone(config);
      config2.network = noProxy;
      await configService.setConfiguration(config2);
      const afterState = await configService.getConfiguration();
      expect(beforeState.config).to.be.not.deep.equal(afterState.config);
      expect(afterState.config?.network).to.be.deep.equal(noProxy);
      expect(eventCounter).to.be.equal(2);
      await assertRawConfigModel((actualModel) => {
        expect(actualModel.network?.proxy).to.be.undefined;
      });
    });

    async function createContainer(): Promise<Container> {
      return createBaseContainer();
    }

    async function assertRawConfigModel(
      assert: (actual: DefaultCliConfig) => MaybePromise<void>
    ): Promise<void> {
      const raw = await fs.readFile(cliConfigPath, { encoding: 'utf8' });
      const model = parseYaml(raw);
      await assert(model);
    }
  });
});
