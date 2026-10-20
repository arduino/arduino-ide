import {
  Container,
  ContainerModule,
  injectable,
} from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { ArduinoPreferences } from '../../browser/arduino-preferences';
import { AuthenticationClientService } from '../../browser/auth/authentication-client-service';
import { CreateApi, isTrustedCloudUrl } from '../../browser/create/create-api';
import { SketchCache } from '../../browser/widgets/cloud-sketchbook/cloud-sketch-cache';
import { SketchesService } from '../../common/protocol/sketches-service';
import { AuthenticationSession } from '../../node/auth/types';

describe('create-api', () => {
  describe('isTrustedCloudUrl', () => {
    [
      'https://api2.arduino.cc/create/v2/sketches',
      'https://api2.arduino.cc:443/create/v2/sketches',
      'https://API2.ARDUINO.CC/create/v2/sketches',
    ].forEach((url) =>
      it(`should trust '${url}'`, () =>
        expect(isTrustedCloudUrl(new URL(url))).to.be.true)
    );

    [
      'http://api2.arduino.cc/create/v2/sketches',
      'https://api2.arduino.cc:8443/create/v2/sketches',
      'https://api2.arduino.cc.example.com/create/v2/sketches',
      'https://evil-api2.arduino.cc/create/v2/sketches',
      'https://arduino.cc/create/v2/sketches',
      'https://user:pass@api2.arduino.cc/create/v2/sketches',
      'https://user@api2.arduino.cc/create/v2/sketches',
      'https://example.com/create/v2/sketches',
    ].forEach((url) =>
      it(`should not trust '${url}'`, () =>
        expect(isTrustedCloudUrl(new URL(url))).to.be.false)
    );
  });

  describe('run', () => {
    let server: Server;
    let serverUrl: string;
    let requests: IncomingMessage[];

    before(async () => {
      server = createServer((req, res) => {
        requests.push(req);
        if (req.url?.startsWith('/redirected')) {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ sketches: [] }));
        } else {
          res.writeHead(302, { location: `${serverUrl}/redirected` });
          res.end();
        }
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      const { port } = server.address() as AddressInfo;
      serverUrl = `http://127.0.0.1:${port}`;
    });

    after(() => new Promise((resolve) => server.close(resolve)));

    beforeEach(() => (requests = []));

    it('should not send requests to an untrusted origin', async () => {
      const createApi = createContainer(`${serverUrl}/create`).get(CreateApi);
      let error: unknown;
      try {
        await createApi.sketches();
      } catch (err) {
        error = err;
      }
      expect(error).to.be.instanceOf(Error);
      expect((<Error>error).message).to.include(serverUrl);
      expect(requests).to.be.empty;
    });

    it('should not follow redirects', async () => {
      const createApi = createContainer(
        `${serverUrl}/create`,
        AllowAllCreateApi
      ).get(CreateApi);
      let error: unknown;
      try {
        await createApi.sketches();
      } catch (err) {
        error = err;
      }
      expect(error).to.be.instanceOf(Error);
      expect(requests).to.have.lengthOf(1);
      expect(requests[0].url).to.match(/^\/create\/v2\/sketches/);
    });
  });

  function createContainer(
    sketchSyncEndpoint: string,
    createApiClass: typeof CreateApi = CreateApi
  ): Container {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(
      new ContainerModule((bind) => {
        bind(CreateApi).to(createApiClass).inSingletonScope();
        bind(SketchCache).toSelf().inSingletonScope();
        bind(AuthenticationClientService).toConstantValue(<
          AuthenticationClientService
        >{
          get session(): AuthenticationSession | undefined {
            return <AuthenticationSession>{ accessToken: 'token' };
          },
        });
        bind(ArduinoPreferences).toConstantValue(<ArduinoPreferences>{
          'arduino.cloud.sketchSyncEndpoint': sketchSyncEndpoint,
        });
        bind(SketchesService).toConstantValue(<SketchesService>{});
      })
    );
    return container;
  }
});

@injectable()
class AllowAllCreateApi extends CreateApi {
  protected override isTrustedUrl(): boolean {
    return true;
  }
}
