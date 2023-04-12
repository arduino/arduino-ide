import {
  Container,
  ContainerModule,
  injectable,
} from '@theia/core/shared/inversify';
import { assert, expect } from 'chai';
import fetch from 'cross-fetch';
import { posix } from 'path';
import { v4 } from 'uuid';
import { ArduinoPreferences } from '../../browser/arduino-preferences';
import { AuthenticationClientService } from '../../browser/auth/authentication-client-service';
import { CreateApi } from '../../browser/create/create-api';
import { splitSketchPath } from '../../browser/create/create-paths';
import { Create, CreateError } from '../../browser/create/typings';
import { SketchCache } from '../../browser/widgets/cloud-sketchbook/cloud-sketch-cache';
import { SketchesService } from '../../common/protocol';
import { AuthenticationSession } from '../../node/auth/types';
import queryString = require('query-string');

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

const timeout = 60 * 1_000;

describe('create-api', () => {
  let createApi: TestCreateApi;

  before(async function () {
    this.timeout(timeout);
    try {
      const accessToken = await login();
      createApi =
        createContainer(accessToken).get<TestCreateApi>(TestCreateApi);
    } catch (err) {
      if (err instanceof LoginFailed) {
        return this.skip();
      }
      throw err;
    }
  });

  beforeEach(async function () {
    this.timeout(timeout);
    await cleanAllSketches();
  });

  function createContainer(accessToken: string): Container {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(
      new ContainerModule((bind) => {
        bind(TestCreateApi).toSelf().inSingletonScope();
        bind(SketchCache).toSelf().inSingletonScope();
        bind(AuthenticationClientService).toConstantValue(<
          AuthenticationClientService
        >{
          get session(): AuthenticationSession | undefined {
            return <AuthenticationSession>{
              accessToken,
            };
          },
        });
        bind(ArduinoPreferences).toConstantValue(<ArduinoPreferences>{
          'arduino.cloud.sketchSyncEndpoint':
            'https://api-dev.arduino.cc/create',
        });
        bind(SketchesService).toConstantValue(<SketchesService>{});
      })
    );
    return container;
  }

  async function login(
    credentials: Credentials | undefined = moduleCredentials() ??
      envCredentials()
  ): Promise<string> {
    if (!credentials) {
      throw new LoginFailed('The credentials are not available to log in.');
    }
    const { username, password, clientSecret: client_secret } = credentials;
    const response = await fetch('https://login.oniudra.cc/oauth/token', {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: queryString.stringify({
        grant_type: 'password',
        username,
        password,
        audience: 'https://api.arduino.cc',
        client_id: 'a4Nge0BdTyFsNnsU0HcZI4hfKN5y9c5A',
        client_secret,
      }),
    });
    const body = await response.json();
    if ('access_token' in body) {
      const { access_token } = body;
      return access_token;
    }
    throw new LoginFailed(
      body.error ??
        `'access_token' was not part of the response object: ${JSON.stringify(
          body
        )}`
    );
  }

  function toPosix(segment: string): string {
    return `/${segment}`;
  }

  /**
   * Does not handle folders. A sketch with `MySketch` name can be under `/MySketch` and `/MyFolder/MySketch`.
   */
  function findByName(
    name: string,
    sketches: Create.Sketch[]
  ): Create.Sketch | undefined {
    return sketches.find((sketch) => sketch.name === name);
  }

  async function cleanAllSketches(): Promise<void> {
    let sketches = await createApi.sketches();
    // Cannot delete the sketches with `await Promise.all` as all delete promise successfully resolve, but the sketch is not deleted from the server.
    await sketches
      .map(({ path }) => createApi.deleteSketch(path))
      .reduce(async (acc, curr) => {
        await acc;
        return curr;
      }, Promise.resolve());
    sketches = await createApi.sketches();
    expect(sketches).to.be.empty;
  }

  it('should delete sketch', async () => {
    const name = v4();
    const content = 'alma\nkorte';
    const posixPath = toPosix(name);

    let sketches = await createApi.sketches();
    let sketch = findByName(name, sketches);
    expect(sketch).to.be.undefined;

    sketch = await createApi.createSketch(posixPath, content);

    sketches = await createApi.sketches();
    sketch = findByName(name, sketches);
    expect(sketch).to.be.not.empty;
    expect(sketch?.path).to.be.not.empty;
    const [, path] = splitSketchPath(sketch?.path!);
    expect(path).to.be.equal(posixPath);

    const sketchContent = await createApi.readFile(
      posixPath + posixPath + '.ino'
    );
    expect(sketchContent).to.be.equal(content);

    await createApi.deleteSketch(sketch?.path!);

    sketches = await createApi.sketches();
    sketch = findByName(name, sketches);
    expect(sketch).to.be.undefined;
  });

  it('should error with HTTP 404 (Not Found) if deleting a non-existing sketch', async () => {
    try {
      await createApi.deleteSketch('/does-not-exist');
      assert.fail('Expected HTTP 404');
    } catch (err) {
      expect(err).to.be.an.instanceOf(CreateError);
      expect((<CreateError>err).status).to.be.equal(404);
    }
  });

  it('should rename a sketch folder with all its content', async () => {
    const name = v4();
    const newName = v4();
    const content = 'void setup(){} void loop(){}';
    const posixPath = toPosix(name);
    const newPosixPath = toPosix(newName);

    await createApi.createSketch(posixPath, content);

    let sketches = await createApi.sketches();
    expect(sketches.length).to.be.equal(1);
    expect(sketches[0].name).to.be.equal(name);

    let sketchContent = await createApi.readFile(
      posixPath + posixPath + '.ino'
    );
    expect(sketchContent).to.be.equal(content);

    await createApi.rename(posixPath, newPosixPath);
    sketches = await createApi.sketches();
    expect(sketches.length).to.be.equal(1);
    expect(sketches[0].name).to.be.equal(newName);

    sketchContent = await createApi.readFile(
      newPosixPath + newPosixPath + '.ino'
    );
    expect(sketchContent).to.be.equal(content);
  });

  it('should error with HTTP 409 (Conflict) when renaming a sketch and the target already exists', async () => {
    const name = v4();
    const otherName = v4();
    const content = 'void setup(){} void loop(){}';
    const posixPath = toPosix(name);
    const otherPosixPath = toPosix(otherName);

    await createApi.createSketch(posixPath, content);
    await createApi.createSketch(otherPosixPath, content);

    let sketches = await createApi.sketches();
    expect(sketches.length).to.be.equal(2);
    expect(findByName(name, sketches)).to.be.not.undefined;
    expect(findByName(otherName, sketches)).to.be.not.undefined;

    try {
      await createApi.rename(posixPath, otherPosixPath);
      assert.fail('Expected HTTP 409');
    } catch (err) {
      expect(err).to.be.an.instanceOf(CreateError);
      expect((<CreateError>err).status).to.be.equal(409);
    }

    sketches = await createApi.sketches();
    expect(sketches.length).to.be.equal(2);
    expect(findByName(name, sketches)).to.be.not.undefined;
    expect(findByName(otherName, sketches)).to.be.not.undefined;
  });

  [
    [-1, 1],
    [0, 2],
    [1, 2],
  ].forEach(([diff, expected]) =>
    it(`should not run unnecessary fetches when retrieving all sketches (sketch count ${
      diff < 0 ? '<' : diff > 0 ? '>' : '='
    } limit)`, async () => {
      const content = 'void setup(){} void loop(){}';
      const maxLimit = 50; // https://github.com/arduino/arduino-ide/pull/875
      const sketchCount = maxLimit + diff;
      const sketchNames = [...Array(sketchCount).keys()].map(() => v4());

      await sketchNames
        .map((name) => createApi.createSketch(toPosix(name), content))
        .reduce(async (acc, curr) => {
          await acc;
          return curr;
        }, Promise.resolve() as Promise<unknown>);

      createApi.resetRequestRecording();
      const sketches = await createApi.sketches();
      const allRequests = createApi.requestRecording.slice();

      expect(sketches.length).to.be.equal(sketchCount);
      sketchNames.forEach(
        (name) => expect(findByName(name, sketches)).to.be.not.undefined
      );

      expect(allRequests.length).to.be.equal(expected);
      const getSketchesRequests = allRequests.filter(
        (description) =>
          description.method === 'GET' &&
          description.pathname === '/create/v2/sketches' &&
          description.query &&
          description.query.includes(`limit=${maxLimit}`)
      );
      expect(getSketchesRequests.length).to.be.equal(expected);
    })
  );

  ['.', '-', '_'].map((char) => {
    it(`should create a new sketch with '${char}' in the sketch folder name although it's disallowed from the Create Editor`, async () => {
      const name = `sketch${char}`;
      const posixPath = toPosix(name);
      const newSketch = await createApi.createSketch(
        posixPath,
        'void setup(){} void loop(){}'
      );

      expect(newSketch).to.be.not.undefined;
      expect(newSketch.name).to.be.equal(name);

      let sketches = await createApi.sketches();
      let sketch = findByName(name, sketches);
      expect(sketch).to.be.not.undefined;
      // TODO: Cannot do deep equals because the Create API responses with different objects on POST and GET
      // `"libraries": [null]` vs `"libraries": []`
      // `"created_at": "2023-02-08T09:39:32.16994555Z"` vs `"created_at": "2023-02-08T09:39:32.169946Z"`
      // expect(newSketch).to.be.deep.equal(sketch);
      expect(newSketch.path).to.be.equal(sketch?.path);
      expect(newSketch.name).to.be.equal(sketch?.name);

      await createApi.deleteSketch(sketch?.path!);
      sketches = await createApi.sketches();
      sketch = findByName(name, sketches);
      expect(sketch).to.be.undefined;
    });
  });

  it("should fetch the sketch when transforming the 'secrets' into '#include' and the sketch is not in the cache", async () => {
    const name = v4();
    const posixPath = toPosix(name);
    const newSketch = await createApi.createSketch(
      posixPath,
      'void setup(){} void loop(){}',
      {
        secrets: {
          data: [
            {
              name: 'SECRET_THING',
              value: '❤︎',
            },
          ],
        },
      }
    );
    expect(newSketch).to.be.not.undefined;
    expect(newSketch.secrets).to.be.not.undefined;
    expect(Array.isArray(newSketch.secrets)).to.be.true;
    expect(newSketch.secrets?.length).to.be.equal(1);
    expect(newSketch.secrets?.[0]).to.be.deep.equal({
      name: 'SECRET_THING',
      value: '❤︎',
    });
    createApi.sketchCache.init(); // invalidate the cache
    const content = await createApi.readFile(
      posix.join(posixPath, `${name}.ino`)
    );
    expect(content.includes(`#include "${Create.arduino_secrets_file}"`)).to.be
      .true;
  });
});

// Using environment variables is recommended for testing but you can modify the module too.
// Put your credential here for local testing. Otherwise, they will be picked up from the environment.
const username = '';
const password = '';
const clientSecret = '';

interface Credentials {
  readonly username: string;
  readonly password: string;
  readonly clientSecret: string;
}

function moduleCredentials(): Credentials | undefined {
  if (!!username && !!password && !!clientSecret) {
    console.log('Using credentials from the module variables.');
    return {
      username,
      password,
      clientSecret,
    };
  }
  return undefined;
}

function envCredentials(): Credentials | undefined {
  const username = process.env.CREATE_USERNAME;
  const password = process.env.CREATE_PASSWORD;
  const clientSecret = process.env.CREATE_CLIENT_SECRET;
  if (!!username && !!password && !!clientSecret) {
    console.log('Using credentials from the environment variables.');
    return {
      username,
      password,
      clientSecret,
    };
  }
  return undefined;
}

class LoginFailed extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, LoginFailed.prototype);
  }
}

@injectable()
class TestCreateApi extends CreateApi {
  private _recording: RequestDescription[] = [];

  constructor() {
    super();
    const originalRun = this['run'];
    this['run'] = (url, init, resultProvider) => {
      this._recording.push(createRequestDescription(url, init));
      return originalRun.bind(this)(url, init, resultProvider);
    };
  }

  resetRequestRecording(): void {
    this._recording = [];
  }

  get requestRecording(): RequestDescription[] {
    return this._recording;
  }
}

interface RequestDescription {
  readonly origin: string;
  readonly pathname: string;
  readonly query?: string;

  readonly method?: string | undefined;
  readonly serializedBody?: string | undefined;
}

function createRequestDescription(
  url: URL,
  init?: RequestInit | undefined
): RequestDescription {
  const { origin, pathname, search: query } = url;
  const method = init?.method;
  const serializedBody = init?.body?.toString();
  return { origin, pathname, query, method, serializedBody };
}
