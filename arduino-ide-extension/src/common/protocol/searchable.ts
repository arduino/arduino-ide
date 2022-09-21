import URI from '@theia/core/lib/common/uri';

export interface Searchable<T, O extends Searchable.Options> {
  search(options: O): Promise<T[]>;
}
export namespace Searchable {
  export interface Options {
    /**
     * Defaults to empty an empty string.
     */
    readonly query?: string;
  }
  export namespace UriParser {
    /**
     * Parses the `URI#fragment` into a query term.
     */
    export function parseQuery(uri: URI): { query: string } {
      return { query: uri.fragment };
    }
    /**
     * Splits the `URI#path#toString` on the `/` POSIX separator into decoded segments. The first, empty segment representing the root is omitted.
     * Examples:
     *  - `/` -> `['']`
     *  - `/All` -> `['All']`
     *  - `/All/Device%20Control` -> `['All', 'Device Control']`
     *  - `/All/Display` -> `['All', 'Display']`
     *  - `/Updatable/Signal%20Input%2FOutput` -> `['Updatable', 'Signal Input', 'Output']` (**caveat**!)
     */
    export function normalizedSegmentsOf(uri: URI): string[] {
      return uri.path.toString().split('/').slice(1).map(decodeURIComponent);
    }
  }
}
