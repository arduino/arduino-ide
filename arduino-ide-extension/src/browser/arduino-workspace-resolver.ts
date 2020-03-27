import { toUnix } from 'upath';
import URI from '@theia/core/lib/common/uri';
import { isWindows } from '@theia/core/lib/common/os';
import { notEmpty } from '@theia/core/lib/common/objects';
import { MaybePromise } from '@theia/core/lib/common/types';

/**
 * Class for determining the default workspace location from the
 * `location.hash`, the historical workspace locations, and recent sketch files.
 * 
 * The following logic is used for determining the default workspace location:
 * - `hash` points to an existing location?
 *  - Yes
 *   - `validate location`. Is valid sketch location?
 *    - Yes
 *     - Done.
 *    - No
 *     - `try open recent workspace roots`, then `try open last modified sketches`, finally `create new sketch`.
 *  - No
 *   - `try open recent workspace roots`, then `try open last modified sketches`, finally `create new sketch`.
 */
namespace ArduinoWorkspaceRootResolver {
    export interface InitOptions {
        readonly isValid: (uri: string) => MaybePromise<boolean>;
    }
    export interface ResolveOptions {
        readonly hash?: string
        readonly recentWorkspaces: string[];
        // Gathered from the default sketch folder. The default sketch folder is defined by the CLI.
        readonly recentSketches: string[];
    }
}
export class ArduinoWorkspaceRootResolver {

    constructor(protected options: ArduinoWorkspaceRootResolver.InitOptions) {
    }

    async resolve(options: ArduinoWorkspaceRootResolver.ResolveOptions): Promise<{ uri: string } | undefined> {
        const { hash, recentWorkspaces, recentSketches } = options;
        for (const uri of [this.hashToUri(hash), ...recentWorkspaces, ...recentSketches].filter(notEmpty)) {
            const valid = await this.isValid(uri);
            if (valid) {
                return { uri };
            }
        }
        return undefined;
    }

    protected isValid(uri: string): MaybePromise<boolean> {
        return this.options.isValid(uri);
    }

    // Note: here, the `hash` was defined as new `URI(yourValidFsPath).path` so we have to map it to a valid FS path first.
    // This is important for Windows only and a NOOP on POSIX.
    // Note: we set the `new URI(myValidUri).path.toString()` as the `hash`. See:
    // - https://github.com/eclipse-theia/theia/blob/8196e9dcf9c8de8ea0910efeb5334a974f426966/packages/workspace/src/browser/workspace-service.ts#L143 and
    // - https://github.com/eclipse-theia/theia/blob/8196e9dcf9c8de8ea0910efeb5334a974f426966/packages/workspace/src/browser/workspace-service.ts#L423
    protected hashToUri(hash: string | undefined): string | undefined {
        if (hash
            && hash.length > 1
            && hash.startsWith('#')) {
            const path = hash.slice(1); // Trim the leading `#`.
            return new URI(toUnix(path.slice(isWindows && hash.startsWith('/') ? 1 : 0))).withScheme('file').toString();
        }
        return undefined;
    }

}
