import { expect } from 'chai';
import {
  AdditionalUrls,
  Config,
  Network,
  ProxySettings,
} from '../../common/protocol';

describe('config-service', () => {
  describe('network', () => {
    const proxy: ProxySettings = {
      protocol: 'http',
      hostname: 'example.com',
      port: '42',
      username: 'foo',
      password: 'bar',
    };

    it('should consider identical proxy settings equal', () => {
      expect(Network.sameAs(proxy, { ...proxy })).to.be.true;
    });

    const changes: ProxySettings = {
      protocol: 'https',
      hostname: 'proxy.example.com',
      port: '123',
      username: 'another-user',
      password: 'another-password',
    };
    for (const field of Object.keys(changes) as (keyof ProxySettings)[]) {
      it(`should detect a change to only the proxy ${field}`, () => {
        const changed = { ...proxy, [field]: changes[field] };
        expect(Network.sameAs(proxy, changed)).to.be.false;
        expect(Network.sameAs(changed, proxy)).to.be.false;
      });
    }

    it('should consider two disabled proxy configurations equal', () => {
      expect(Network.sameAs('none', 'none')).to.be.true;
    });

    it('should distinguish a manual proxy from a disabled proxy', () => {
      expect(Network.sameAs(proxy, 'none')).to.be.false;
      expect(Network.sameAs('none', proxy)).to.be.false;
    });
  });

  describe('sameAs', () => {
    const config: Config = {
      locale: 'en',
      sketchDirUri: 'file:///sketchbook',
      dataDirUri: 'file:///data',
      additionalUrls: [],
      network: {
        protocol: 'http',
        hostname: 'example.com',
        port: '42',
        username: 'foo',
        password: 'bar',
      },
    };

    it('should consider configurations with identical proxy settings equal', () => {
      const copy: Config = {
        ...config,
        network: { ...(config.network as ProxySettings) },
      };
      expect(Config.sameAs(config, copy)).to.be.true;
    });

    it('should detect a configuration change to only the proxy port', () => {
      const changed: Config = {
        ...config,
        network: { ...(config.network as ProxySettings), port: '123' },
      };
      expect(Config.sameAs(config, changed)).to.be.false;
      expect(Config.sameAs(changed, config)).to.be.false;
    });
  });

  describe('additionalUrls', () => {
    it('should consider additional URLs same as if they differ in case', () => {
      expect(AdditionalUrls.sameAs(['aaaa'], ['AAAA'])).to.be.true;
    });
    it('should consider additional URLs same as if they have a different order', () => {
      expect(AdditionalUrls.sameAs(['bbbb', 'aaaa'], ['aaaa', 'bbbb'])).to.be
        .true;
    });
    it('should parse an empty string as an empty array', () => {
      expect(AdditionalUrls.parse('', ',')).to.be.empty;
    });
    it('should parse a blank string as an empty array', () => {
      expect(AdditionalUrls.parse('   ', ',')).to.be.empty;
    });
    it('should parse urls with commas', () => {
      expect(AdditionalUrls.parse('  ,a  , b , c,   ', ',')).to.be.deep.equal([
        'a',
        'b',
        'c',
      ]);
    });
    it("should parse urls with both '\\n' and '\\r\\n' line endings", () => {
      expect(
        AdditionalUrls.parse(
          'a ' + '\r\n' + '   b ' + '\n' + '   c ' + '\r\n' + '  ' + '\n' + '',
          'newline'
        )
      ).to.be.deep.equal(['a', 'b', 'c']);
    });
  });
});
