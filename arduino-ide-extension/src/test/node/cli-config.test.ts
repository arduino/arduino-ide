import { expect } from 'chai';
import { DefaultCliConfig } from '../../node/cli-config';

describe('cli-config', () => {
  type ConfigProvider = DefaultCliConfig | { (): DefaultCliConfig };

  (
    [
      [defaultConfig, defaultConfig, true],
      [
        () => {
          const conf = defaultConfig();
          delete conf.board_manager;
          return conf;
        },
        defaultConfig,
        true,
      ],
      [
        () => {
          const conf = defaultConfig();
          return conf;
        },
        defaultConfig,
        true,
      ],
    ] as [ConfigProvider, ConfigProvider, boolean][]
  ).forEach(([leftInput, rightInput, expectation]) => {
    const left = typeof leftInput === 'function' ? leftInput() : leftInput;
    const right = typeof rightInput === 'function' ? rightInput() : rightInput;
    it(`${JSON.stringify(left)} should ${
      expectation ? '' : 'not '
    }be the same as ${JSON.stringify(right)}`, () => {
      expect(DefaultCliConfig.sameAs(left, right)).to.be.equal(expectation);
    });
  });

  function defaultConfig(): DefaultCliConfig {
    return {
      board_manager: {
        additional_urls: [],
      },
      directories: {
        data: 'data',
        downloads: 'downloads',
        user: 'user',
      },
    };
  }
});
