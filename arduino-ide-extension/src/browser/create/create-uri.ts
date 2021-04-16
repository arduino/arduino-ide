import { URI as Uri } from 'vscode-uri';
import URI from '@theia/core/lib/common/uri';
import { Create } from './create-api';
import { toPosixPath, parentPosix, posix } from './create-paths';

export namespace CreateUri {
    export const scheme = 'arduino-create';
    export const root = toUri(posix.sep);

    export function toUri(posixPathOrResource: string | Create.Resource): URI {
        const posixPath =
            typeof posixPathOrResource === 'string'
                ? posixPathOrResource
                : toPosixPath(posixPathOrResource.path);
        return new URI(
            Uri.parse(posixPath).with({ scheme, authority: 'create' })
        );
    }

    export function is(uri: URI): boolean {
        return uri.scheme === scheme;
    }

    export function equals(left: URI, right: URI): boolean {
        return is(left) && is(right) && left.toString() === right.toString();
    }

    export function parent(uri: URI): URI {
        if (!is(uri)) {
            throw new Error(
                `Invalid URI scheme. Expected '${scheme}' got '${uri.scheme}' instead.`
            );
        }
        if (equals(uri, root)) {
            return uri;
        }
        return toUri(parentPosix(uri.path.toString()));
    }
}
