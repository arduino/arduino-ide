import { injectable, inject } from '@theia/core/shared/inversify';
import * as createPaths from './create-paths';
import { posix } from './create-paths';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { ArduinoPreferences } from '../arduino-preferences';
import { SketchCache } from '../widgets/cloud-sketchbook/cloud-sketch-cache';
import { Create, CreateError } from './typings';

export interface ResponseResultProvider {
  (response: Response): Promise<any>;
}
export namespace ResponseResultProvider {
  export const NOOP: ResponseResultProvider = async () => undefined;
  export const TEXT: ResponseResultProvider = (response) => response.text();
  export const JSON: ResponseResultProvider = (response) => response.json();
}

export function Utf8ArrayToStr(array: Uint8Array): string {
  let out, i, c;
  let char2, char3;

  out = '';
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
}

type ResourceType = 'f' | 'd';

@injectable()
export class CreateApi {
  @inject(SketchCache)
  protected sketchCache: SketchCache;

  protected authenticationService: AuthenticationClientService;
  protected arduinoPreferences: ArduinoPreferences;

  public init(
    authenticationService: AuthenticationClientService,
    arduinoPreferences: ArduinoPreferences
  ): CreateApi {
    this.authenticationService = authenticationService;
    this.arduinoPreferences = arduinoPreferences;

    return this;
  }

  getSketchSecretStat(sketch: Create.Sketch): Create.Resource {
    return {
      href: `${sketch.href}${posix.sep}${Create.arduino_secrets_file}`,
      modified_at: sketch.modified_at,
      created_at: sketch.created_at,
      name: `${Create.arduino_secrets_file}`,
      path: `${sketch.path}${posix.sep}${Create.arduino_secrets_file}`,
      mimetype: 'text/x-c++src; charset=utf-8',
      type: 'file',
    };
  }

  async sketch(id: string): Promise<Create.Sketch> {
    const url = new URL(`${this.domain()}/sketches/byID/${id}`);

    url.searchParams.set('user_id', 'me');
    const headers = await this.headers();
    const result = await this.run<Create.Sketch>(url, {
      method: 'GET',
      headers,
    });
    return result;
  }

  async sketches(limit = 50): Promise<Create.Sketch[]> {
    const url = new URL(`${this.domain()}/sketches`);
    url.searchParams.set('user_id', 'me');
    url.searchParams.set('limit', limit.toString());
    const headers = await this.headers();
    const result: { sketches: Create.Sketch[] } = { sketches: [] };

    let partialSketches: Create.Sketch[] = [];
    let currentOffset = 0;
    do {
      url.searchParams.set('offset', currentOffset.toString());
      partialSketches = (
        await this.run<{ sketches: Create.Sketch[] }>(url, {
          method: 'GET',
          headers,
        })
      ).sketches;
      if (partialSketches.length !== 0) {
        result.sketches = result.sketches.concat(partialSketches);
      }
      currentOffset = currentOffset + limit;
    } while (partialSketches.length !== 0);

    result.sketches.forEach((sketch) => this.sketchCache.addSketch(sketch));
    return result.sketches;
  }

  async createSketch(
    posixPath: string,
    content: string = CreateApi.defaultInoContent
  ): Promise<Create.Sketch> {
    const url = new URL(`${this.domain()}/sketches`);
    const headers = await this.headers();
    const payload = {
      ino: btoa(content),
      path: posixPath,
      user_id: 'me',
    };
    const init = {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers,
    };
    const result = await this.run<Create.Sketch>(url, init);
    return result;
  }

  async readDirectory(
    posixPath: string,
    options: {
      recursive?: boolean;
      match?: string;
      skipSketchCache?: boolean;
    } = {}
  ): Promise<Create.Resource[]> {
    const url = new URL(
      `${this.domain()}/files/d/$HOME/sketches_v2${posixPath}`
    );
    if (options.recursive) {
      url.searchParams.set('deep', 'true');
    }
    if (options.match) {
      url.searchParams.set('name_like', options.match);
    }
    const headers = await this.headers();

    const cachedSketch = this.sketchCache.getSketch(posixPath);

    const sketchPromise = options.skipSketchCache
      ? (cachedSketch && this.sketch(cachedSketch.id)) || Promise.resolve(null)
      : Promise.resolve(this.sketchCache.getSketch(posixPath));

    return Promise.all([
      sketchPromise,
      this.run<Create.RawResource[]>(url, {
        method: 'GET',
        headers,
      }),
    ])
      .then(async ([sketch, result]) => {
        if (posixPath.length && posixPath !== posix.sep) {
          if (sketch && sketch.secrets && sketch.secrets.length > 0) {
            result.push(this.getSketchSecretStat(sketch));
          }
        }

        return result.filter(
          (res) => !Create.do_not_sync_files.includes(res.name)
        );
      })
      .catch((reason) => {
        if (reason?.status === 404) return [] as Create.Resource[];
        else throw reason;
      });
  }

  async createDirectory(posixPath: string): Promise<void> {
    const url = new URL(
      `${this.domain()}/files/d/$HOME/sketches_v2${posixPath}`
    );
    const headers = await this.headers();
    await this.run(url, {
      method: 'POST',
      headers,
    });
  }

  async stat(posixPath: string): Promise<Create.Resource> {
    // The root is a directory read.
    if (posixPath === '/') {
      throw new Error('Stating the root is not supported');
    }
    // The RESTful API has different endpoints for files and directories.
    // The RESTful API does not provide specific error codes, only HTP 500.
    // We query the parent directory and look for the file with the last segment.
    const parentPosixPath = createPaths.parentPosix(posixPath);
    const basename = createPaths.basename(posixPath);

    let resources;
    if (basename === Create.arduino_secrets_file) {
      const sketch = this.sketchCache.getSketch(parentPosixPath);
      resources = sketch ? [this.getSketchSecretStat(sketch)] : [];
    } else {
      resources = await this.readDirectory(parentPosixPath, {
        match: basename,
      });
    }
    const resource = resources.find(
      ({ path }) => createPaths.splitSketchPath(path)[1] === posixPath
    );
    if (!resource) {
      throw new CreateError(`Not found: ${posixPath}.`, 404);
    }
    return resource;
  }

  private async toggleSecretsInclude(
    path: string,
    data: string,
    mode: 'add' | 'remove'
  ) {
    const includeString = `#include "${Create.arduino_secrets_file}"`;
    const includeRegexp = new RegExp(includeString + '\\s*', 'g');

    const basename = createPaths.basename(path);
    if (mode === 'add') {
      const doesIncludeSecrets = includeRegexp.test(data);

      if (doesIncludeSecrets) {
        return data;
      }

      const sketch = this.sketchCache.getSketch(createPaths.parentPosix(path));

      if (
        sketch &&
        (sketch.name + '.ino' === basename ||
          sketch.name + '.pde' === basename) &&
        sketch.secrets &&
        sketch.secrets.length > 0
      ) {
        return includeString + '\n' + data;
      }
    } else if (mode === 'remove') {
      return data.replace(includeRegexp, '');
    }
    return data;
  }

  async readFile(posixPath: string): Promise<string> {
    const basename = createPaths.basename(posixPath);

    if (basename === Create.arduino_secrets_file) {
      const parentPosixPath = createPaths.parentPosix(posixPath);

      //retrieve the sketch id from the cache
      const cacheSketch = this.sketchCache.getSketch(parentPosixPath);
      if (!cacheSketch) {
        throw new Error(`Unable to find sketch ${parentPosixPath} in cache`);
      }

      // get a fresh copy of the sketch in order to guarantee fresh secrets
      const sketch = await this.sketch(cacheSketch.id);
      if (!sketch) {
        throw new Error(
          `Unable to get a fresh copy of the sketch ${cacheSketch.id}`
        );
      }
      this.sketchCache.addSketch(sketch);

      let file = '';
      if (sketch && sketch.secrets) {
        for (const item of sketch.secrets) {
          file += `#define ${item.name} "${item.value}"\r\n`;
        }
      }
      return file;
    }

    const url = new URL(
      `${this.domain()}/files/f/$HOME/sketches_v2${posixPath}`
    );
    const headers = await this.headers();
    const result = await this.run<{ data: string; path: string }>(url, {
      method: 'GET',
      headers,
    });
    let { data } = result;

    // add includes to main arduino file
    data = await this.toggleSecretsInclude(posixPath, atob(data), 'add');
    return data;
  }

  async writeFile(
    posixPath: string,
    content: string | Uint8Array
  ): Promise<void> {
    const basename = createPaths.basename(posixPath);

    if (basename === Create.arduino_secrets_file) {
      const parentPosixPath = createPaths.parentPosix(posixPath);

      const sketch = this.sketchCache.getSketch(parentPosixPath);

      if (sketch) {
        const url = new URL(`${this.domain()}/sketches/${sketch.id}`);
        const headers = await this.headers();

        // parse the secret file
        const secrets = (
          typeof content === 'string' ? content : Utf8ArrayToStr(content)
        )
          .split(/\r?\n/)
          .reduce((prev, curr) => {
            // check if the line contains a secret
            const secret = curr.split('SECRET_')[1] || null;
            if (!secret) {
              return prev;
            }
            const regexp = /(\S*)\s+([\S\s]*)/g;
            const tokens = regexp.exec(secret) || [];
            const name = tokens[1].length > 0 ? `SECRET_${tokens[1]}` : '';

            let value = '';
            if (tokens[2].length > 0) {
              value = JSON.parse(
                JSON.stringify(
                  tokens[2].replace(/^['"]?/g, '').replace(/['"]?$/g, '')
                )
              );
            }

            if (name.length === 0) {
              return prev;
            }

            return [...prev, { name, value }];
          }, []);

        const payload = {
          id: sketch.id,
          libraries: sketch.libraries,
          secrets: { data: secrets },
        };

        // replace the sketch in the cache with the one we are pushing
        // TODO: we should do a get after the POST, in order to be sure the cache
        // is updated the most recent metadata
        this.sketchCache.addSketch(sketch);

        const init = {
          method: 'POST',
          body: JSON.stringify(payload),
          headers,
        };
        await this.run(url, init);
      }
      return;
    }

    // do not upload "do_not_sync" files/directoris and their descendants
    const segments = posixPath.split(posix.sep) || [];
    if (
      segments.some((segment) => Create.do_not_sync_files.includes(segment))
    ) {
      return;
    }

    const url = new URL(
      `${this.domain()}/files/f/$HOME/sketches_v2${posixPath}`
    );
    const headers = await this.headers();

    let data: string =
      typeof content === 'string' ? content : Utf8ArrayToStr(content);
    data = await this.toggleSecretsInclude(posixPath, data, 'remove');

    const payload = { data: btoa(data) };
    const init = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    };
    await this.run(url, init);
  }

  async deleteFile(posixPath: string): Promise<void> {
    await this.delete(posixPath, 'f');
  }

  async deleteDirectory(posixPath: string): Promise<void> {
    await this.delete(posixPath, 'd');
  }

  private async delete(posixPath: string, type: ResourceType): Promise<void> {
    const url = new URL(
      `${this.domain()}/files/${type}/$HOME/sketches_v2${posixPath}`
    );
    const headers = await this.headers();
    await this.run(url, {
      method: 'DELETE',
      headers,
    });
  }

  async rename(fromPosixPath: string, toPosixPath: string): Promise<void> {
    const url = new URL(`${this.domain('v3')}/files/mv`);
    const headers = await this.headers();
    const payload = {
      from: `$HOME/sketches_v2${fromPosixPath}`,
      to: `$HOME/sketches_v2${toPosixPath}`,
    };
    const init = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    };
    await this.run(url, init, ResponseResultProvider.NOOP);
  }

  async editSketch({
    id,
    params,
  }: {
    id: string;
    params: Record<string, unknown>;
  }): Promise<Create.Sketch> {
    const url = new URL(`${this.domain()}/sketches/${id}`);

    const headers = await this.headers();
    const result = await this.run<Create.Sketch>(url, {
      method: 'POST',
      body: JSON.stringify({ id, ...params }),
      headers,
    });
    return result;
  }

  async copy(fromPosixPath: string, toPosixPath: string): Promise<void> {
    const payload = {
      from: `$HOME/sketches_v2${fromPosixPath}`,
      to: `$HOME/sketches_v2${toPosixPath}`,
    };
    const url = new URL(`${this.domain('v3')}/files/cp`);
    const headers = await this.headers();
    const init = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    };
    await this.run(url, init, ResponseResultProvider.NOOP);
  }

  private async run<T>(
    requestInfo: RequestInfo | URL,
    init: RequestInit | undefined,
    resultProvider: ResponseResultProvider = ResponseResultProvider.JSON
  ): Promise<T> {
    const response = await fetch(
      requestInfo instanceof URL ? requestInfo.toString() : requestInfo,
      init
    );
    if (!response.ok) {
      let details: string | undefined = undefined;
      try {
        details = await response.json();
      } catch (e) {
        console.error('Cloud not get the error details.', e);
      }
      const { statusText, status } = response;
      throw new CreateError(statusText, status, details);
    }
    const result = await resultProvider(response);
    return result;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.token();
    return {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    };
  }

  private domain(apiVersion = 'v2'): string {
    const endpoint = this.arduinoPreferences['arduino.cloud.sketchSyncEnpoint'];
    return `${endpoint}/${apiVersion}`;
  }

  private async token(): Promise<string> {
    return this.authenticationService.session?.accessToken || '';
  }
}

export namespace CreateApi {
  export const defaultInoContent = `/*

*/

void setup() {
  
}

void loop() {
  
}

`;
}
