import { injectable } from 'inversify';
import * as createPaths from './create-paths';
import { posix, splitSketchPath } from './create-paths';
import { AuthenticationClientService } from '../auth/authentication-client-service';
import { ArduinoPreferences } from '../arduino-preferences';

export interface ResponseResultProvider {
    (response: Response): Promise<any>;
}
export namespace ResponseResultProvider {
    export const NOOP: ResponseResultProvider = async () => undefined;
    export const TEXT: ResponseResultProvider = (response) => response.text();
    export const JSON: ResponseResultProvider = (response) => response.json();
}

type ResourceType = 'f' | 'd';

export let sketchCache: Create.Sketch[] = [];

@injectable()
export class CreateApi {
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

    async findSketchByPath(
        path: string,
        trustCache = true
    ): Promise<Create.Sketch | undefined> {
        const skatches = sketchCache;
        const sketch = skatches.find((sketch) => {
            const [, spath] = splitSketchPath(sketch.path);
            return path === spath;
        });
        if (trustCache) {
            return Promise.resolve(sketch);
        }
        return await this.sketch({ id: sketch?.id });
    }

    getSketchSecretStat(sketch: Create.Sketch): Create.Resource {
        return {
            href: `${sketch.href}${posix.sep}${Create.arduino_secrets_file}`,
            modified_at: sketch.modified_at,
            name: `${Create.arduino_secrets_file}`,
            path: `${sketch.path}${posix.sep}${Create.arduino_secrets_file}`,
            mimetype: 'text/x-c++src; charset=utf-8',
            type: 'file',
            sketchId: sketch.id,
        };
    }

    async sketch(opt: {
        id?: string;
        path?: string;
    }): Promise<Create.Sketch | undefined> {
        let url;
        if (opt.id) {
            url = new URL(`${this.domain()}/sketches/byID/${opt.id}`);
        } else if (opt.path) {
            url = new URL(`${this.domain()}/sketches/byPath${opt.path}`);
        } else {
            return;
        }

        url.searchParams.set('user_id', 'me');
        const headers = await this.headers();
        const result = await this.run<Create.Sketch>(url, {
            method: 'GET',
            headers,
        });
        return result;
    }

    async sketches(): Promise<Create.Sketch[]> {
        const url = new URL(`${this.domain()}/sketches`);
        url.searchParams.set('user_id', 'me');
        const headers = await this.headers();
        const result = await this.run<{ sketches: Create.Sketch[] }>(url, {
            method: 'GET',
            headers,
        });
        sketchCache = result.sketches;
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
        options: { recursive?: boolean; match?: string; secrets?: boolean } = {}
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

        const sketchProm = options.secrets
            ? this.sketches()
            : Promise.resolve(sketchCache);

        return Promise.all([
            this.run<Create.RawResource[]>(url, {
                method: 'GET',
                headers,
            }),
            sketchProm,
        ])
            .then(async ([result, sketches]) => {
                if (options.secrets) {
                    // for every sketch with secrets, create a fake arduino_secrets.h
                    result.forEach(async (res) => {
                        if (res.type !== 'sketch') {
                            return;
                        }

                        const [, spath] = createPaths.splitSketchPath(res.path);
                        const sketch = await this.findSketchByPath(spath);
                        if (
                            sketch &&
                            sketch.secrets &&
                            sketch.secrets.length > 0
                        ) {
                            result.push(this.getSketchSecretStat(sketch));
                        }
                    });

                    if (posixPath !== posix.sep) {
                        const sketch = await this.findSketchByPath(posixPath);
                        if (
                            sketch &&
                            sketch.secrets &&
                            sketch.secrets.length > 0
                        ) {
                            result.push(this.getSketchSecretStat(sketch));
                        }
                    }
                }
                const sketchesMap: Record<string, Create.Sketch> =
                    sketches.reduce((prev, curr) => {
                        return { ...prev, [curr.path]: curr };
                    }, {});

                // add the sketch id and isPublic to the resource
                return result.map((resource) => {
                    return {
                        ...resource,
                        sketchId: sketchesMap[resource.path]?.id || '',
                        isPublic:
                            sketchesMap[resource.path]?.is_public || false,
                    };
                });
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
            const sketch = await this.findSketchByPath(parentPosixPath);
            resources = sketch ? [this.getSketchSecretStat(sketch)] : [];
        } else {
            resources = await this.readDirectory(parentPosixPath, {
                match: basename,
            });
        }

        resources.sort((left, right) => left.path.length - right.path.length);
        const resource = resources.find(({ name }) => name === basename);
        if (!resource) {
            throw new CreateError(`Not found: ${posixPath}.`, 404);
        }
        return resource;
    }

    async readFile(posixPath: string): Promise<string> {
        const basename = createPaths.basename(posixPath);

        if (basename === Create.arduino_secrets_file) {
            const parentPosixPath = createPaths.parentPosix(posixPath);
            const sketch = await this.findSketchByPath(parentPosixPath, false);

            let file = '';
            if (sketch && sketch.secrets) {
                for (const item of sketch?.secrets) {
                    file += `#define ${item.name} "${item.value}"\r\n`;
                }
            }
            return file;
        }

        const url = new URL(
            `${this.domain()}/files/f/$HOME/sketches_v2${posixPath}`
        );
        const headers = await this.headers();
        const result = await this.run<{ data: string }>(url, {
            method: 'GET',
            headers,
        });
        const { data } = result;
        return atob(data);
    }

    async writeFile(
        posixPath: string,
        content: string | Uint8Array
    ): Promise<void> {
        const basename = createPaths.basename(posixPath);

        if (basename === Create.arduino_secrets_file) {
            const parentPosixPath = createPaths.parentPosix(posixPath);
            const sketch = await this.findSketchByPath(parentPosixPath);
            if (sketch) {
                const url = new URL(`${this.domain()}/sketches/${sketch.id}`);
                const headers = await this.headers();

                // parse the secret file
                const secrets = (
                    typeof content === 'string'
                        ? content
                        : new TextDecoder().decode(content)
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
                        const name =
                            tokens[1].length > 0 ? `SECRET_${tokens[1]}` : '';

                        let value = '';
                        if (tokens[2].length > 0) {
                            value = JSON.parse(
                                JSON.stringify(
                                    tokens[2]
                                        .replace(/^['"]?/g, '')
                                        .replace(/['"]?$/g, '')
                                )
                            );
                        }

                        if (name.length === 0 || value.length === 0) {
                            return prev;
                        }

                        return [...prev, { name, value }];
                    }, []);

                const payload = {
                    id: sketch.id,
                    libraries: sketch.libraries,
                    secrets: { data: secrets },
                };

                // replace the sketch in the cache, so other calls will not overwrite each other
                sketchCache = sketchCache.filter((skt) => skt.id !== sketch.id);
                sketchCache.push({ ...sketch, secrets });

                const init = {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers,
                };
                await this.run(url, init);
            }
            return;
        }

        const url = new URL(
            `${this.domain()}/files/f/$HOME/sketches_v2${posixPath}`
        );
        const headers = await this.headers();
        const data = btoa(
            typeof content === 'string'
                ? content
                : new TextDecoder().decode(content)
        );
        const payload = { data };
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
        const endpoint =
            this.arduinoPreferences['arduino.cloud.sketchSyncEnpoint'];
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

export namespace Create {
    export interface Sketch {
        readonly name: string;
        readonly path: string;
        readonly modified_at: string;
        readonly created_at: string;

        readonly secrets?: { name: string; value: string }[];

        readonly id: string;
        readonly is_public: boolean;
        // readonly board_fqbn: '',
        // readonly board_name: '',
        // readonly board_type: 'serial' | 'network' | 'cloud' | '',
        readonly href?: string;
        readonly libraries: string[];
        // readonly tutorials: string[] | null;
        // readonly types: string[] | null;
        // readonly user_id: string;
    }

    export type ResourceType = 'sketch' | 'folder' | 'file';
    export const arduino_secrets_file = 'arduino_secrets.h';
    export interface Resource {
        readonly name: string;
        /**
         * Note: this path is **not** the POSIX path we use. It has the leading segments with the `user_id`.
         */
        readonly path: string;
        readonly type: ResourceType;
        readonly sketchId: string;
        readonly modified_at: string; // As an ISO-8601 formatted string: `YYYY-MM-DDTHH:mm:ss.sssZ`
        readonly children?: number; // For 'sketch' and 'folder' types.
        readonly size?: number; // For 'sketch' type only.
        readonly isPublic?: boolean; // For 'sketch' type only.

        readonly mimetype?: string; // For 'file' type.
        readonly href?: string;
    }
    export namespace Resource {
        export function is(arg: any): arg is Resource {
            return (
                !!arg &&
                'name' in arg &&
                typeof arg['name'] === 'string' &&
                'path' in arg &&
                typeof arg['path'] === 'string' &&
                'type' in arg &&
                typeof arg['type'] === 'string' &&
                'modified_at' in arg &&
                typeof arg['modified_at'] === 'string' &&
                (arg['type'] === 'sketch' ||
                    arg['type'] === 'folder' ||
                    arg['type'] === 'file')
            );
        }
    }

    export type RawResource = Omit<Resource, 'sketchId' | 'isPublic'>;
}

export class CreateError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly details?: string
    ) {
        super(message);
        Object.setPrototypeOf(this, CreateError.prototype);
    }
}
