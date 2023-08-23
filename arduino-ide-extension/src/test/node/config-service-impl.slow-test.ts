import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { deepClone } from '@theia/core/lib/common/objects';
import type { MaybePromise, Mutable } from '@theia/core/lib/common/types';
import type { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { load as parseYaml } from 'js-yaml';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import temp from 'temp';
import {
  Config,
  Network,
  ProxySettings,
} from '../../common/protocol/config-service';
import { CLI_CONFIG, DefaultCliConfig } from '../../node/cli-config';
import { ConfigServiceImpl } from '../../node/config-service-impl';
import { ConfigDirUriProvider } from '../../node/theia/env-variables/env-variables-server';
import {
  createBaseContainer,
  createCliConfig,
  startDaemon,
} from './node-test-bindings';

describe('config-service-impl', () => {
  const noProxy = 'none';
  const manualProxy: ProxySettings = {
    protocol: 'http',
    hostname: 'hostname',
    password: 'secret',
    username: 'username',
    port: '1234',
  };

  describe('setConfiguration', () => {
    let configService: ConfigServiceImpl;
    let toDispose: DisposableCollection;
    let cliConfigPath: string;

    beforeEach(async () => {
      const container = await createBaseContainer();
      toDispose = new DisposableCollection();
      await startDaemon(container, toDispose);
      configService = container.get<ConfigServiceImpl>(ConfigServiceImpl);
      cliConfigPath = getCliConfigPath(container);
    });

    afterEach(() => toDispose.dispose());

    it("should detect 'none' proxy with th default config", async () => {
      const state = await configService.getConfiguration();
      expect(state.config).to.be.not.undefined;
      const config = <Config>state.config;
      expect(config.network).to.be.equal(noProxy);
      expect(Network.stringify(config.network)).is.undefined;
      await assertRawConfigModel(cliConfigPath, (actualModel) => {
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
      await assertRawConfigModel(cliConfigPath, (actualModel) => {
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
      await assertRawConfigModel(cliConfigPath, (actualModel) => {
        expect(actualModel.network?.proxy).to.be.undefined;
      });
    });
  });

  describe('setConfiguration (multiple CLI daemon sessions)', () => {
    let tracked: typeof temp;
    let toDispose: DisposableCollection;

    before(() => {
      tracked = temp.track();
      toDispose = new DisposableCollection(
        Disposable.create(() => tracked.cleanupSync())
      );
    });

    after(() => toDispose.dispose());

    it("should unset the 'network#proxy' config value between daemon sessions", async () => {
      const configDirPath = tracked.mkdirSync();
      const cliConfigPath = join(configDirPath, CLI_CONFIG);
      const cliConfig = await createCliConfig(configDirPath);
      const setupContainer = await createBaseContainer({
        cliConfig,
        configDirPath,
      });
      const toDisposeAfterFirstStart = new DisposableCollection();
      toDispose.push(toDisposeAfterFirstStart);
      await startDaemon(setupContainer, toDisposeAfterFirstStart);
      toDisposeAfterFirstStart.dispose();

      // second startup when the indexes are all downloaded and the daemon is initialized with the network#proxy
      cliConfig.network = { proxy: Network.stringify(manualProxy) };
      const container = await createBaseContainer({ cliConfig, configDirPath });
      await startDaemon(container, toDispose);
      const configService = container.get<ConfigServiceImpl>(ConfigServiceImpl);
      let eventCounter = 0;
      toDispose.push(configService.onConfigChange(() => eventCounter++));

      const beforeState = await configService.getConfiguration();
      const config = <Mutable<Config>>deepClone(beforeState.config);
      config.network = noProxy;
      await configService.setConfiguration(config);
      const afterState = await configService.getConfiguration();
      expect(beforeState.config).to.be.not.deep.equal(afterState.config);
      expect(afterState.config?.network).to.be.deep.equal(noProxy);
      expect(eventCounter).to.be.equal(1);
      await assertRawConfigModel(cliConfigPath, (actualModel) => {
        expect(actualModel.network?.proxy).to.be.undefined; // currently fails due to arduino/arduino-cli#2275
      });
    });
  });

  async function assertRawConfigModel(
    cliConfigPath: string,
    assert: (actual: DefaultCliConfig) => MaybePromise<void>
  ): Promise<void> {
    const raw = await fs.readFile(cliConfigPath, { encoding: 'utf8' });
    const model = parseYaml(raw);
    await assert(model);
  }

  function getCliConfigPath(container: Container): string {
    const configDirUriProvider =
      container.get<ConfigDirUriProvider>(ConfigDirUriProvider);
    return configDirUriProvider
      .configDirUri()
      .resolve(CLI_CONFIG)
      .path.fsPath();
  }
});
